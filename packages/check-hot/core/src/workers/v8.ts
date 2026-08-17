import { emitWorkerResult, parseWorkerRequest } from "../protocol.js";
import {
    checkV8Tier,
    classifyV8Tier
} from "../runtime-oracles/v8-tier/check.js";
import type { HotProblemOccurrence } from "../problems/types.js";
import { HotProblemError, recordCaughtProblem } from "../problems/error.js";
import { createRuntimeEventRecorder } from "../runtime-events/index.js";
import type {
    HotAstEvidence,
    HotMutationObservation,
    HotMutationFamily,
    HotRuntimeInfo,
    HotScenario,
    HotTargetResult,
    HotWorkerResult,
    V8Inspection
} from "../types.js";
import {
    createCoverageLedger,
    loadHotSuite,
    resolveHotWork,
    runHotChecks,
    runHotPhase,
    serializeInvocations
} from "../worker-shared.js";

interface DenoRuntime {
    args: string[];
    exitCode: number;
    version: { deno: string; v8: string };
}

const deno = (globalThis as { Deno?: DenoRuntime }).Deno;
const request = parseWorkerRequest(
    deno ? deno.args.at(-1) : process.argv.at(-1)
);
const timeline = createRuntimeEventRecorder();
const workerPurpose = request.purpose ?? "measurement";
const streamId =
    workerPurpose === "diagnostic"
        ? `diagnostic:${request.diagnostic ?? "unknown"}:v8-worker`
        : `${workerPurpose}:v8`;
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

/* oxlint-disable no-eval, no-unused-vars -- V8 syntax must be parsed only after the runtime enables allow-natives-syntax; Deno rejects literal intrinsics while parsing the module. */
const prepareFunction = (fn: CallableFunction) =>
    eval("%PrepareFunctionForOptimization(fn)");
const optimizeFunction = (fn: CallableFunction) =>
    eval("%OptimizeFunctionOnNextCall(fn)");
const deoptimizeFunction = (fn: CallableFunction) =>
    eval("%DeoptimizeFunction(fn)");
const neverOptimizeFunction = (fn: CallableFunction) =>
    eval("%NeverOptimizeFunction(fn)");
const optimizationStatus = (fn: CallableFunction) =>
    eval("%GetOptimizationStatus(fn)") as number;
const isOptimized = (status: number) => (status & ((1 << 4) | (1 << 5))) !== 0;
const activeTierIsMaglev = (fn: CallableFunction) =>
    eval("%ActiveTierIsMaglev(fn)") as boolean;
const activeTierIsTurbofan = (fn: CallableFunction) =>
    eval("%ActiveTierIsTurbofan(fn)") as boolean;

const engine: V8Inspection = {
    kind: "v8",
    sameMap: (left, right) => eval("%HaveSameMap(left, right)") as boolean,
    hasFastProperties: value => eval("%HasFastProperties(value)") as boolean,
    hasDictionaryElements: value =>
        eval("%HasDictionaryElements(value)") as boolean,
    arrayElementsKind: value => {
        if (eval("%HasSmiElements(value)") as boolean) return "SMI";
        if (eval("%HasDoubleElements(value)") as boolean) return "DOUBLE";
        if (eval("%HasObjectElements(value)") as boolean) return "OBJECT";
        return "UNKNOWN";
    },
    isPackedArray: value =>
        (eval("%HasFastElements(value)") as boolean) &&
        (eval("%HasFastPackedElements(value)") as boolean) &&
        !(eval("%HasHoleyElements(value)") as boolean) &&
        !(eval("%HasDictionaryElements(value)") as boolean),
    isSmi: value => eval("%IsSmi(value)") as boolean,
    optimizationStatus,
    debugPrint: value => {
        eval("%DebugPrint(value)");
    }
};
/* oxlint-enable no-eval, no-unused-vars */

const runtime: HotRuntimeInfo = deno
    ? {
          name: "deno",
          version: deno.version.deno,
          engine: "v8",
          engineVersion: deno.version.v8,
          tier: request.tier as "maglev" | "turbofan",
          oracleId: "v8-native-intrinsics",
          oracleVersion: "1"
      }
    : {
          name: "node",
          version: process.versions.node,
          engine: "v8",
          engineVersion: process.versions.v8,
          tier: request.tier as "maglev" | "turbofan",
          oracleId: "v8-native-intrinsics",
          oracleVersion: "1"
      };

const objectMapClasses = new WeakMap<object, object[]>();
const callableClasses = new WeakMap<CallableFunction, CallableFunction[]>();

const observeMutation = (
    family: HotMutationFamily,
    seed: unknown,
    value: unknown,
    variant: string
): Omit<HotMutationObservation, "siteHitCount" | "replayFingerprint"> => {
    let representation: string = typeof value;
    let verified: boolean;
    const adapterVariant = variant.startsWith("adapter-");
    if (family === "numeric-representation") {
        representation =
            typeof value === "number"
                ? Object.is(value, -0)
                    ? "negative-zero"
                    : Number.isNaN(value)
                      ? "nan"
                      : engine.isSmi(value)
                        ? "smi"
                        : "heap-number"
                : typeof value;
        verified =
            (adapterVariant && typeof value === "number") ||
            (variant === "seed-number" && representation === "smi") ||
            (variant === "fractional-double" &&
                representation === "heap-number") ||
            (variant === "negative-zero" &&
                representation === "negative-zero") ||
            (variant === "nan" && representation === "nan") ||
            ((variant === "int32-overflow" || variant === "uint32-overflow") &&
                representation === "heap-number");
    } else if (family === "array-elements" && Array.isArray(value)) {
        const kind = engine.arrayElementsKind(value);
        const packed = engine.isPackedArray(value);
        const dictionary = engine.hasDictionaryElements(value);
        representation = `${dictionary ? "dictionary" : packed ? "packed" : "holey"}-${kind.toLowerCase()}`;
        verified =
            adapterVariant ||
            (variant === "packed-smi" && packed && kind === "SMI") ||
            (variant === "packed-double" && packed && kind === "DOUBLE") ||
            (variant === "packed-object" && packed && kind === "OBJECT") ||
            (variant === "holey" && !packed && !dictionary) ||
            (variant === "dictionary" && dictionary);
    } else if (family === "object-shape") {
        verified =
            typeof seed === "object" &&
            seed !== null &&
            typeof value === "object" &&
            value !== null;
        if (verified) {
            const seedObject = seed as object;
            const valueObject = value as object;
            const classes = objectMapClasses.get(seedObject) ?? [seedObject];
            let classIndex = classes.findIndex(representative =>
                engine.sameMap(representative, valueObject)
            );
            if (classIndex < 0) {
                classIndex = classes.length;
                classes.push(valueObject);
            }
            objectMapClasses.set(seedObject, classes);
            representation = `map-class-${classIndex}`;
            verified =
                adapterVariant ||
                variant === "original-order" ||
                classIndex > 0;
        } else {
            representation = "not-object";
        }
    } else if (family === "callback-identity") {
        if (typeof seed === "function" && typeof value === "function") {
            const classes = callableClasses.get(seed) ?? [seed];
            let classIndex = classes.indexOf(value);
            if (classIndex < 0) {
                classIndex = classes.length;
                classes.push(value);
            }
            callableClasses.set(seed, classes);
            representation = `callable-class-${classIndex}`;
            verified = adapterVariant || classIndex > 0;
        } else {
            representation = "not-callable";
            verified = false;
        }
    } else if (family === "prototype-chain") {
        const nullPrototype =
            typeof value === "object" &&
            value !== null &&
            Object.getPrototypeOf(value) === null;
        representation = nullPrototype
            ? "null-prototype"
            : "ordinary-prototype";
        verified = adapterVariant
            ? typeof value === "object" && value !== null
            : representation === variant;
    } else if (family === "property-key") {
        representation = `${typeof value}-key`;
        verified =
            (adapterVariant &&
                (typeof value === "string" ||
                    typeof value === "number" ||
                    typeof value === "symbol")) ||
            (variant === "symbol-key" && typeof value === "symbol") ||
            (variant === "index-key" && typeof value === "number") ||
            (variant === "string-key" && typeof value === "string") ||
            variant === "seed-key";
    } else if (family === "control-flow") {
        const changedBranch = Boolean(seed) !== Boolean(value);
        representation = changedBranch ? "alternate-branch" : "baseline-branch";
        verified = adapterVariant
            ? typeof value === "boolean" || typeof value === "number"
            : representation === variant;
    } else if (family === "allocation-pressure" && Array.isArray(value)) {
        representation = `array-length-${value.length}`;
        verified = adapterVariant || value.length >= 64;
    } else if (family === "return-representation") {
        if (typeof value === "number") {
            representation = Object.is(value, -0)
                ? "number:negative-zero"
                : Number.isNaN(value)
                  ? "number:nan"
                  : engine.isSmi(value)
                    ? "number:smi"
                    : "number:heap";
        } else if (Array.isArray(value)) {
            representation = `array:${engine.arrayElementsKind(value).toLowerCase()}`;
        } else if (
            typeof seed === "object" &&
            seed !== null &&
            typeof value === "object" &&
            value !== null
        ) {
            representation = engine.sameMap(seed, value)
                ? "object:same-map"
                : "object:different-map";
        } else {
            representation = value === null ? "null" : typeof value;
        }
        verified = adapterVariant;
    } else if (family === "dynamic-code") {
        representation = "site-executed";
        verified = adapterVariant;
    } else {
        verified = false;
    }
    return { variant, representation, verified };
};

interface PreciseCoverageResult {
    result: readonly {
        url: string;
        functions: readonly {
            isBlockCoverage: boolean;
            ranges: readonly {
                startOffset: number;
                endOffset: number;
                count: number;
            }[];
        }[];
    }[];
}

interface InspectorSessionLike {
    post(
        method: string,
        parameters?: Record<string, unknown>
    ): Promise<unknown>;
}

let inspectedTarget = 0;
const targetLocationMatches = async (
    session: InspectorSessionLike,
    target: CallableFunction,
    evidence: HotAstEvidence | undefined,
    sha256: (source: string) => string
) => {
    if (!evidence) return false;
    const key = `__checkHotInspectTarget${inspectedTarget++}`;
    (globalThis as Record<string, unknown>)[key] = target;
    try {
        const evaluated = (await session.post("Runtime.evaluate", {
            expression: `globalThis[${JSON.stringify(key)}]`
        })) as { result: { objectId?: string } };
        if (!evaluated.result.objectId) return false;
        const properties = (await session.post("Runtime.getProperties", {
            objectId: evaluated.result.objectId,
            ownProperties: false
        })) as {
            internalProperties?: readonly {
                name: string;
                value?: {
                    value?: {
                        scriptId?: string;
                        lineNumber?: number;
                        columnNumber?: number;
                    };
                };
            }[];
        };
        const location = properties.internalProperties?.find(
            property => property.name === "[[FunctionLocation]]"
        )?.value?.value;
        if (
            !location?.scriptId ||
            location.lineNumber === undefined ||
            location.columnNumber === undefined
        ) {
            return false;
        }
        const script = (await session.post("Debugger.getScriptSource", {
            scriptId: location.scriptId
        })) as { scriptSource: string };
        if (sha256(script.scriptSource) !== evidence.span.sourceSha256) {
            return false;
        }
        const lineStarts = [0];
        for (let index = 0; index < script.scriptSource.length; index++) {
            if (script.scriptSource.charCodeAt(index) === 10) {
                lineStarts.push(index + 1);
            }
        }
        const lineStart = lineStarts[location.lineNumber];
        if (lineStart === undefined) return false;
        const offset = lineStart + location.columnNumber;
        const ownerSource = script.scriptSource.slice(
            evidence.ownerSpan.start,
            evidence.ownerSpan.end
        );
        const headerMarkers = [
            ownerSource.indexOf("{"),
            ownerSource.indexOf("=>")
        ].filter(index => index >= 0);
        const headerEnd =
            evidence.ownerSpan.start +
            (headerMarkers.length > 0
                ? Math.min(...headerMarkers) + 2
                : Math.min(ownerSource.length, 256));
        return offset >= evidence.ownerSpan.start && offset <= headerEnd;
    } finally {
        delete (globalThis as Record<string, unknown>)[key];
    }
};

const exactEvidenceHitCount = (
    coverage: PreciseCoverageResult,
    evidence: HotAstEvidence | undefined,
    fileURLToPath: (url: string) => string
) => {
    const script = evidence
        ? coverage.result.find(item => {
              try {
                  return (
                      item.url.startsWith("file:") &&
                      fileURLToPath(item.url) === evidence.span.file
                  );
              } catch {
                  return false;
              }
          })
        : undefined;
    // A function-only range proves that the owner was called, not that an
    // inner expression or branch executed. Exact AST evidence therefore
    // requires V8's block coverage for the containing function.
    const ranges =
        script?.functions
            .filter(fn => fn.isBlockCoverage)
            .flatMap(fn => fn.ranges) ?? [];
    const overlappingMiss = evidence
        ? ranges.some(
              range =>
                  range.count === 0 &&
                  range.startOffset < evidence.span.end &&
                  range.endOffset > evidence.span.start
          )
        : true;
    const enclosing = evidence
        ? ranges
              .filter(
                  range =>
                      range.count > 0 &&
                      range.startOffset <= evidence.span.start &&
                      range.endOffset >= evidence.span.end
              )
              .toSorted(
                  (left, right) =>
                      left.endOffset -
                      left.startOffset -
                      (right.endOffset - right.startOffset)
              )
        : [];
    return overlappingMiss ? 0 : (enclosing[0]?.count ?? 0);
};

function __checkHotStressBoundary__() {}
function __checkHotStressEndBoundary__() {}

const problems: HotProblemOccurrence[] = [];
const completedChecks: string[] = [];
let result: HotWorkerResult;
let work: Awaited<ReturnType<typeof resolveHotWork>> | undefined;
let suite: Awaited<ReturnType<typeof loadHotSuite>> | undefined;
let unsupportedOracle = false;

if (request.purpose === "preflight") {
    try {
        phaseEvent("setup", "phase-start", "Suite setup started");
        suite = await loadHotSuite(request.suiteUrl, runtime);
        phaseEvent("setup", "phase-end", "Suite setup completed");
        phaseEvent("checks", "phase-start", "Semantic preflight started");
        let preflight;
        if (runtime.name === "node") {
            const [{ Session }, { fileURLToPath }, { createHash }] =
                await Promise.all([
                    import("node:inspector/promises"),
                    import("node:url"),
                    import("node:crypto")
                ]);
            const session = new Session();
            session.connect();
            let preciseCoverageStarted = false;
            try {
                await session.post("Profiler.enable");
                await session.post("Runtime.enable");
                await session.post("Debugger.enable");
                await session.post("Profiler.startPreciseCoverage", {
                    callCount: true,
                    detailed: true
                });
                preciseCoverageStarted = true;
                const measureEvidence = async <Value>(
                    evidenceId: string,
                    target: CallableFunction,
                    action: () => Value | Promise<Value>
                ) => {
                    const evidence = suite?.evidence?.find(
                        item => item.id === evidenceId
                    );
                    if (
                        evidence &&
                        /\.(?:[cm]?ts|tsx|jsx)$/u.test(evidence.span.file)
                    ) {
                        return { value: await action(), siteHitCount: 0 };
                    }
                    const targetMatches = await targetLocationMatches(
                        session,
                        target,
                        evidence,
                        source =>
                            createHash("sha256").update(source).digest("hex")
                    );
                    const value = await action();
                    const coverage = (await session.post(
                        "Profiler.takePreciseCoverage"
                    )) as PreciseCoverageResult;
                    const siteHitCount = exactEvidenceHitCount(
                        coverage,
                        evidence,
                        fileURLToPath
                    );
                    return {
                        value,
                        siteHitCount: targetMatches ? siteHitCount : 0
                    };
                };
                preflight = suite.preflight
                    ? await suite.preflight({
                          runtime,
                          inspect: request.inspect,
                          scenarios: request.scenarios,
                          observeMutation,
                          measureEvidence
                      })
                    : [];
            } finally {
                if (preciseCoverageStarted) {
                    await session.post("Profiler.stopPreciseCoverage");
                }
                await session.post("Debugger.disable");
                await session.post("Runtime.disable");
                await session.post("Profiler.disable");
                session.disconnect();
            }
        } else {
            const raw = suite.preflight
                ? await suite.preflight({
                      runtime,
                      inspect: request.inspect,
                      scenarios: request.scenarios,
                      observeMutation
                  })
                : [];
            preflight = raw.map(outcome =>
                Object.assign({}, outcome, {
                    status: "blocked" as const,
                    siteHitCount: 0,
                    reason:
                        outcome.reason ??
                        "Deno/V8 does not currently expose precise AST-site coverage to check-hot preflight"
                })
            );
        }
        phaseEvent("checks", "phase-end", "Semantic preflight completed");
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
} else if (request.purpose === "validation") {
    try {
        phaseEvent("setup", "phase-start", "Suite setup started");
        suite = await loadHotSuite(request.suiteUrl, runtime);
        if (runtime.name !== "node") {
            throw new Error(
                "Guarded AST-site lifecycle validation currently requires Node Inspector"
            );
        }
        work = await resolveHotWork(
            suite,
            request.scenarios,
            runtime,
            request.inspect,
            request.preflightOutcomes
        );
        phaseEvent("setup", "phase-end", "Suite setup completed");
        // Precise block coverage can collapse to a function-wide range after
        // optimization. This disposable process validates branch/site
        // reachability after the real warmup call sequence, so keep the exact
        // target bytecode observable here; the separate measurement process
        // remains responsible for tier and deoptimization assertions.
        for (const target of work.targets.values()) {
            neverOptimizeFunction(target);
        }
        const validated = structuredClone(request.preflightOutcomes ?? []);
        const [{ Session }, { fileURLToPath }, { createHash }] =
            await Promise.all([
                import("node:inspector/promises"),
                import("node:url"),
                import("node:crypto")
            ]);
        const session = new Session();
        session.connect();
        let preciseCoverageStarted = false;
        try {
            await session.post("Profiler.enable");
            await session.post("Runtime.enable");
            await session.post("Debugger.enable");
            await session.post("Profiler.startPreciseCoverage", {
                callCount: true,
                detailed: true
            });
            preciseCoverageStarted = true;
            for (const outcome of validated) {
                if (outcome.status !== "accepted") continue;
                const obligation = suite.obligations?.find(
                    candidate => candidate.id === outcome.obligationId
                );
                const evidence = suite.evidence?.find(
                    candidate => candidate.id === outcome.evidenceId
                );
                const scenario = work.scenarios.find(
                    candidate => candidate.id === outcome.scenarioId
                );
                const targetId = obligation?.exportName;
                const scenarioSelectsTarget =
                    targetId !== undefined &&
                    scenario?.targets.some(target =>
                        typeof target === "string"
                            ? target === targetId
                            : target.id === targetId
                    );
                const target = targetId
                    ? work.targets.get(targetId)
                    : undefined;
                /* oxlint-disable no-await-in-loop -- One Inspector session must attest each selected target against its own source owner before the shared lifecycle starts. */
                const matches =
                    scenarioSelectsTarget && target
                        ? await targetLocationMatches(
                              session,
                              target,
                              evidence,
                              source =>
                                  createHash("sha256")
                                      .update(source)
                                      .digest("hex")
                          )
                        : false;
                /* oxlint-enable no-await-in-loop */
                if (!matches) {
                    outcome.status = "blocked";
                    outcome.reason =
                        "Guarded validation resolved a target whose Inspector function location does not match the exact AST owner";
                }
            }
            phaseEvent("warmup", "phase-start", "Validation warmup started");
            await runHotPhase(
                work,
                runtime,
                "warmup",
                neverOptimizeFunction,
                request.warmupIterations,
                undefined,
                scenarioEvent
            );
            phaseEvent("warmup", "phase-end", "Validation warmup completed");
            // Keep the same coverage session so V8 retains block granularity,
            // but reset all warmup counters before measuring stress variants.
            await session.post("Profiler.takePreciseCoverage");
            phaseEvent("stress", "phase-start", "Validation stress started");
            await runHotPhase(
                work,
                runtime,
                "stress",
                () => {},
                request.stressIterations,
                async (scenario, iteration, action) => {
                    const obligationIds = scenario.obligations ?? [];
                    const hasPendingObservation = obligationIds.some(
                        obligationId => {
                            const outcome = validated.find(
                                candidate =>
                                    candidate.obligationId === obligationId &&
                                    candidate.scenarioId === scenario.id
                            );
                            return (
                                iteration <
                                (outcome?.mutationPlan?.observations.filter(
                                    observation =>
                                        observation.variant !==
                                        "adapter-baseline"
                                ).length ?? 0)
                            );
                        }
                    );
                    if (!hasPendingObservation || obligationIds.length === 0) {
                        await action();
                        return;
                    }
                    await action();
                    const coverage = (await session.post(
                        "Profiler.takePreciseCoverage"
                    )) as PreciseCoverageResult;
                    for (const obligationId of obligationIds) {
                        const obligation = suite?.obligations?.find(
                            candidate => candidate.id === obligationId
                        );
                        const evidence = suite?.evidence?.find(
                            candidate => candidate.id === obligation?.evidenceId
                        );
                        const outcome = validated.find(
                            candidate =>
                                candidate.obligationId === obligationId &&
                                candidate.scenarioId === scenario.id
                        );
                        const stressObservations =
                            outcome?.mutationPlan?.observations.filter(
                                observation =>
                                    observation.variant !== "adapter-baseline"
                            ) ?? [];
                        const observation = stressObservations[iteration];
                        if (observation) {
                            observation.guardedSiteHitCount =
                                exactEvidenceHitCount(
                                    coverage,
                                    evidence,
                                    fileURLToPath
                                );
                        }
                    }
                },
                scenarioEvent
            );
            phaseEvent("stress", "phase-end", "Validation stress completed");
        } finally {
            if (preciseCoverageStarted) {
                await session.post("Profiler.stopPreciseCoverage");
            }
            await session.post("Debugger.disable");
            await session.post("Runtime.disable");
            await session.post("Profiler.disable");
            session.disconnect();
        }
        result = {
            suite: suite.name,
            runtime,
            adapter: suite.adapter,
            scenarios: request.scenarios,
            targets: [],
            checks: [],
            invocations: serializeInvocations(work.invocations),
            coverage: [],
            preflight: validated,
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
            invocations: work ? serializeInvocations(work.invocations) : {},
            coverage: [],
            preflight: [],
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
} else {
    try {
        phaseEvent("setup", "phase-start", "Suite setup started");
        suite = await loadHotSuite(request.suiteUrl, runtime);
        try {
            activeTierIsMaglev(__checkHotStressBoundary__);
            activeTierIsTurbofan(__checkHotStressBoundary__);
        } catch (error) {
            unsupportedOracle = true;
            const message = `Unsupported V8 tier oracle: ${error instanceof Error ? error.message : String(error)}`;
            throw new HotProblemError("v8-tier-oracle-unsupported", message, {
                cause: error
            });
        }
        neverOptimizeFunction(runHotPhase);
        work = await resolveHotWork(
            suite,
            request.scenarios,
            runtime,
            request.inspect,
            request.preflightOutcomes
        );
        phaseEvent("setup", "phase-end", "Suite setup completed");

        const measurementPreflights = request.preflightOutcomes ?? [];
        if (
            runtime.name === "node" &&
            measurementPreflights.some(outcome => outcome.status === "accepted")
        ) {
            const [{ Session }, { createHash }] = await Promise.all([
                import("node:inspector/promises"),
                import("node:crypto")
            ]);
            const session = new Session();
            session.connect();
            try {
                await session.post("Runtime.enable");
                await session.post("Debugger.enable");
                for (const outcome of measurementPreflights) {
                    if (outcome.status !== "accepted") continue;
                    const obligation = suite.obligations?.find(
                        candidate => candidate.id === outcome.obligationId
                    );
                    const evidence = suite.evidence?.find(
                        candidate => candidate.id === outcome.evidenceId
                    );
                    const scenario = work.scenarios.find(
                        candidate => candidate.id === outcome.scenarioId
                    );
                    const targetId = obligation?.exportName;
                    const scenarioSelectsTarget =
                        targetId !== undefined &&
                        scenario?.targets.some(target =>
                            typeof target === "string"
                                ? target === targetId
                                : target.id === targetId
                        );
                    const target = targetId
                        ? work.targets.get(targetId)
                        : undefined;
                    /* oxlint-disable no-await-in-loop -- Target-location checks share the worker Inspector session and must finish before optimization begins. */
                    const matches =
                        scenarioSelectsTarget && target
                            ? await targetLocationMatches(
                                  session,
                                  target,
                                  evidence,
                                  source =>
                                      createHash("sha256")
                                          .update(source)
                                          .digest("hex")
                              )
                            : false;
                    /* oxlint-enable no-await-in-loop */
                    if (!matches) {
                        throw new Error(
                            `Measurement target for ${outcome.obligationId} does not match its exact Inspector AST owner`
                        );
                    }
                }
            } finally {
                await session.post("Debugger.disable");
                await session.post("Runtime.disable");
                session.disconnect();
            }
        }

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
            neverOptimizeFunction,
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

        phaseEvent(
            "optimization",
            "phase-start",
            `V8 ${request.tier} optimization requests started`
        );
        for (const fn of work.targets.values()) {
            deoptimizeFunction(fn);
            prepareFunction(fn);
            optimizeFunction(fn);
        }
        phaseEvent(
            "optimization",
            "phase-end",
            `V8 ${request.tier} optimization requests completed`
        );

        prepareFunction(__checkHotStressBoundary__);
        optimizeFunction(__checkHotStressBoundary__);
        __checkHotStressBoundary__();

        phaseEvent("stress", "phase-start", "Guarded stress started");
        await runHotPhase(
            work,
            runtime,
            "stress",
            neverOptimizeFunction,
            request.stressIterations,
            undefined,
            scenarioEvent
        );
        phaseEvent("stress", "phase-end", "Guarded stress completed");

        prepareFunction(__checkHotStressEndBoundary__);
        optimizeFunction(__checkHotStressEndBoundary__);
        __checkHotStressEndBoundary__();

        const targets: HotTargetResult[] = [];
        for (const [id, fn] of work.targets) {
            const status = optimizationStatus(fn);
            const activeTier = classifyV8Tier({
                maglev: activeTierIsMaglev(fn),
                turbofan: activeTierIsTurbofan(fn),
                optimized: isOptimized(status)
            });
            const requestedTier = request.tier as "maglev" | "turbofan";
            const tierProblem = checkV8Tier(
                id,
                requestedTier,
                activeTier,
                status
            );
            const optimized = tierProblem === undefined;
            targets.push({
                id,
                functionName: fn.name,
                engine: "v8",
                status,
                optimized,
                requestedTier,
                activeTier
            });
            timeline.add({
                streamId,
                purpose: workerPurpose,
                phase: "optimization",
                kind: "target-tier",
                source: "v8-native-intrinsics",
                correlation: "target",
                targetId: id,
                functionName: fn.name,
                message: `Requested ${requestedTier}; active ${activeTier}; status ${status}`
            });
            if (tierProblem) {
                problems.push(tierProblem);
            }
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
            events: timeline.events
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
if (problems.length > 0) {
    if (deno) deno.exitCode = 1;
    else process.exitCode = 1;
}
