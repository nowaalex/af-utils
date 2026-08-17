import { emitWorkerResult, parseWorkerRequest } from "../protocol.js";
import {
    checkJscCompilation,
    classifyJscCompilation
} from "../runtime-oracles/jsc-compilation/check.js";
import {
    parseJscSamplingProfile,
    type BunSamplingProfile
} from "../runtime-oracles/jsc-sampling/parse.js";
import type { HotProblemOccurrence } from "../problems/types.js";
import { HotProblemError, recordCaughtProblem } from "../problems/error.js";
import { createRuntimeEventRecorder } from "../runtime-events/index.js";
import type {
    HotRuntimeInfo,
    HotScenario,
    HotTargetResult,
    HotWorkerResult,
    JscInspection
} from "../types.js";
import {
    createCoverageLedger,
    loadHotSuite,
    resolveHotWork,
    runHotChecks,
    runHotPhase,
    serializeInvocations
} from "../worker-shared.js";

interface BunRuntime {
    version: string;
}

interface BunJscModule {
    /** Describe one JavaScriptCore value for diagnostics. */
    jscDescribe(value: unknown): string;
    /** Describe one JavaScriptCore array for diagnostics. */
    jscDescribeArray(value: unknown[]): string;
    /** Return how many times a function reached the DFG compiler. */
    numberOfDFGCompiles(fn: CallableFunction): number;
    /** Request optimized compilation for the next function invocation. */
    optimizeNextInvocation(fn: CallableFunction): void;
    /** Return the count of delayed reoptimization attempts. */
    reoptimizationRetryCount(fn: CallableFunction): number;
    /** Return cumulative compiler time for a function. */
    totalCompileTime(fn: CallableFunction): number;
    /** Run the public JSC sampling profiler around one callback. */
    profile<T>(
        callback: () => T,
        sampleInterval?: number
    ): T extends Promise<unknown>
        ? Promise<BunSamplingProfile>
        : BunSamplingProfile;
}

const bun = (globalThis as { Bun?: BunRuntime }).Bun;
const request = parseWorkerRequest(process.argv.at(-1));
const timeline = createRuntimeEventRecorder();
const workerPurpose = request.purpose ?? "measurement";
const streamId =
    workerPurpose === "diagnostic"
        ? `diagnostic:${request.diagnostic ?? "unknown"}:jsc-worker`
        : `${workerPurpose}:jsc`;
const phaseEvent = (
    phase:
        | "setup"
        | "warmup"
        | "optimization"
        | "stress"
        | "checks"
        | "teardown",
    kind: "phase-start" | "phase-end",
    message: string
) =>
    timeline.add({
        streamId,
        purpose: workerPurpose,
        phase,
        kind,
        source: "worker-lifecycle",
        correlation: "phase",
        message
    });
const scenarioEvent = (
    kind: "phase-start" | "phase-end",
    scenario: HotScenario<unknown>,
    phase: "warmup" | "stress"
) =>
    timeline.add({
        streamId,
        purpose: workerPurpose,
        phase,
        kind,
        source: "worker-lifecycle",
        correlation: "scenario",
        scenarioId: scenario.id,
        obligationId:
            scenario.obligations?.length === 1
                ? scenario.obligations[0]
                : undefined,
        message: `${scenario.id} ${kind === "phase-start" ? "started" : "completed"}`
    });
const bunJscSpecifier = "bun:jsc";
let jsc: BunJscModule;
const runtime: HotRuntimeInfo = {
    name: "bun",
    version: bun?.version ?? "unknown",
    engine: "jsc",
    engineVersion: undefined,
    tier: "jsc",
    oracleId: "bun-jsc-public-api",
    oracleVersion: "1"
};
const engine: JscInspection = {
    kind: "jsc",
    describe: value => jsc.jscDescribe(value),
    describeArray: value => jsc.jscDescribeArray(value)
};
const keepHarnessOutOfTargetAccounting = () => {};

const problems: HotProblemOccurrence[] = [];
const completedChecks: string[] = [];
let result: HotWorkerResult;
let work: Awaited<ReturnType<typeof resolveHotWork>> | undefined;
let suite: Awaited<ReturnType<typeof loadHotSuite>> | undefined;
let unsupportedOracle = false;
let jscSampling: HotWorkerResult["diagnostics"];

if (request.purpose === "preflight") {
    try {
        phaseEvent("setup", "phase-start", "Suite setup started");
        suite = await loadHotSuite(request.suiteUrl, runtime);
        phaseEvent("setup", "phase-end", "Suite setup completed");
        phaseEvent("checks", "phase-start", "Semantic preflight started");
        const rawPreflight = suite.preflight
            ? await suite.preflight({
                  runtime,
                  inspect: request.inspect,
                  scenarios: request.scenarios
              })
            : [];
        phaseEvent("checks", "phase-end", "Semantic preflight completed");
        const preflight = rawPreflight.map(outcome =>
            Object.assign({}, outcome, {
                status: "blocked" as const,
                siteHitCount: 0,
                reason:
                    outcome.reason ??
                    "Bun/JSC does not currently expose precise AST-site coverage to check-hot preflight"
            })
        );
        result = {
            suite: suite.name,
            runtime,
            adapter: suite.adapter,
            scenarios: request.scenarios,
            targets: [],
            checks: [],
            invocations: {},
            coverage: [],
            preflight,
            problems,
            events: timeline.events
        };
    } catch (error) {
        recordCaughtProblem(problems, error);
        result = {
            suite: suite?.name ?? request.suiteUrl,
            runtime,
            adapter: suite?.adapter,
            scenarios: request.scenarios,
            targets: [],
            checks: [],
            invocations: {},
            coverage: [],
            preflight: [],
            problems,
            events: timeline.events
        };
    }
} else {
    try {
        suite = await loadHotSuite(request.suiteUrl, runtime);
        try {
            jsc = (await import(bunJscSpecifier)) as BunJscModule;
            for (const capability of [
                "jscDescribe",
                "jscDescribeArray",
                "numberOfDFGCompiles",
                "optimizeNextInvocation",
                "reoptimizationRetryCount",
                "totalCompileTime"
            ] as const) {
                if (typeof jsc[capability] !== "function") {
                    throw new Error(`bun:jsc is missing ${capability}`);
                }
            }
            if (
                request.diagnostic === "jsc-sampling" &&
                typeof jsc.profile !== "function"
            ) {
                jscSampling = {
                    jscSampling: {
                        oracleVersion: "1",
                        sampleIntervalMicroseconds: 100,
                        totalSamples: 0,
                        tiers: {},
                        functions: "",
                        bytecodes: "",
                        stackTraces: [],
                        stackTraceCount: 0,
                        stackTracesTruncated: false,
                        gap: "bun:jsc.profile is unavailable in this Bun build."
                    }
                };
            }
        } catch (error) {
            unsupportedOracle = true;
            const message = `Unsupported Bun/JSC oracle: ${error instanceof Error ? error.message : String(error)}`;
            throw new HotProblemError("jsc-oracle-unsupported", message, {
                cause: error
            });
        }
        work = await resolveHotWork(
            suite,
            request.scenarios,
            runtime,
            request.inspect,
            request.preflightOutcomes
        );
        phaseEvent("setup", "phase-end", "Suite setup completed");
        phaseEvent("checks", "phase-start", "Setup checks started");
        await runHotChecks(
            work,
            runtime,
            engine,
            "setup",
            request.inspect,
            completedChecks
        );
        phaseEvent("checks", "phase-end", "Setup checks completed");
        phaseEvent("warmup", "phase-start", "Warmup started");
        await runHotPhase(
            work,
            runtime,
            "warmup",
            keepHarnessOutOfTargetAccounting,
            request.warmupIterations,
            undefined,
            scenarioEvent
        );
        phaseEvent("warmup", "phase-end", "Warmup completed");
        phaseEvent("checks", "phase-start", "After-warmup checks started");
        await runHotChecks(
            work,
            runtime,
            engine,
            "afterWarmup",
            request.inspect,
            completedChecks
        );
        phaseEvent("checks", "phase-end", "After-warmup checks completed");

        const retriesBefore = new Map<string, number>();
        phaseEvent(
            "optimization",
            "phase-start",
            "JSC optimization requests started"
        );
        for (const [id, fn] of work.targets) {
            retriesBefore.set(id, jsc.reoptimizationRetryCount(fn));
            jsc.optimizeNextInvocation(fn);
        }
        phaseEvent(
            "optimization",
            "phase-end",
            "JSC optimization requests completed"
        );

        phaseEvent("stress", "phase-start", "Guarded stress started");
        if (
            request.diagnostic === "jsc-sampling" &&
            typeof jsc.profile === "function"
        ) {
            const sampleInterval = 100;
            const profile = await jsc.profile(
                () =>
                    runHotPhase(
                        work as NonNullable<typeof work>,
                        runtime,
                        "stress",
                        keepHarnessOutOfTargetAccounting,
                        request.stressIterations,
                        undefined,
                        scenarioEvent
                    ),
                sampleInterval
            );
            jscSampling = {
                jscSampling: parseJscSamplingProfile(profile, sampleInterval)
            };
            timeline.add({
                streamId,
                purpose: "diagnostic",
                phase: "diagnostic",
                kind: "sampling-profile",
                source: "jsc-public-api",
                correlation: "phase",
                message: `JSC sampling observed ${jscSampling.jscSampling?.totalSamples ?? 0} samples during stress`
            });
        } else {
            await runHotPhase(
                work,
                runtime,
                "stress",
                keepHarnessOutOfTargetAccounting,
                request.stressIterations,
                undefined,
                scenarioEvent
            );
        }
        phaseEvent("stress", "phase-end", "Guarded stress completed");

        const targets: HotTargetResult[] = [];
        for (const [id, fn] of work.targets) {
            const dfgCompiles = jsc.numberOfDFGCompiles(fn);
            const reoptimizationRetries = jsc.reoptimizationRetryCount(fn);
            const observation = classifyJscCompilation(dfgCompiles);
            targets.push({
                id,
                functionName: fn.name,
                engine: "jsc",
                ...observation,
                dfgCompiles,
                reoptimizationRetries,
                compileTime: jsc.totalCompileTime(fn)
            });
            timeline.add({
                streamId,
                purpose: workerPurpose,
                phase: "optimization",
                kind: "target-tier",
                source: "jsc-public-api",
                correlation: "target",
                targetId: id,
                functionName: fn.name,
                message: `DFG compiled historically=${observation.compiledHistorically}; current tier is not observable`
            });
            const targetProblems = checkJscCompilation(
                id,
                dfgCompiles,
                retriesBefore.get(id) ?? 0,
                reoptimizationRetries
            );
            problems.push(...targetProblems);
        }

        phaseEvent("checks", "phase-start", "After-stress checks started");
        await runHotChecks(
            work,
            runtime,
            engine,
            "afterStress",
            request.inspect,
            completedChecks
        );
        phaseEvent("checks", "phase-end", "After-stress checks completed");
        result = {
            suite: suite.name,
            runtime,
            adapter: suite.adapter,
            scenarios: request.scenarios,
            targets,
            checks: completedChecks,
            invocations: serializeInvocations(work.invocations),
            coverage: createCoverageLedger(
                suite,
                request.scenarios,
                problems.length === 0 ? "passed" : "failed",
                request.preflightOutcomes
            ),
            problems,
            events: timeline.events,
            diagnostics: jscSampling
        };
    } catch (error) {
        recordCaughtProblem(problems, error);
        result = {
            suite: work?.suite.name ?? request.suiteUrl,
            runtime,
            adapter: suite?.adapter,
            scenarios: request.scenarios,
            targets: [],
            checks: completedChecks,
            invocations: work ? serializeInvocations(work.invocations) : {},
            coverage: suite
                ? createCoverageLedger(
                      suite,
                      request.scenarios,
                      unsupportedOracle ? "unsupported" : "failed",
                      request.preflightOutcomes
                  )
                : [],
            problems,
            events: timeline.events
        };
    } finally {
        if (work?.suite.teardown) {
            try {
                phaseEvent("teardown", "phase-start", "Teardown started");
                await work.suite.teardown(work.state);
                phaseEvent("teardown", "phase-end", "Teardown completed");
            } catch (error) {
                recordCaughtProblem(
                    problems,
                    error,
                    "runtime-worker-execution-failure",
                    "teardown: "
                );
            }
        }
    }
}

await emitWorkerResult(result);
if (problems.length > 0) process.exitCode = 1;
