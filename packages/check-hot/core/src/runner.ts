import {
    mkdir,
    mkdtemp,
    readFile,
    rm,
    stat,
    writeFile
} from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { validateHotAnnotations } from "./annotations.js";
import { mapWithConcurrency } from "./concurrency.js";
import type { HotWorkerRequest } from "./protocol.js";
import { executeProcess } from "./process-execution.js";
import {
    discoverOxcNativeBindings,
    oxcNativeEnvironmentNames
} from "./oxc-runtime.js";
import type {
    HotRunMode,
    HotRunResult,
    HotRunSummary,
    HotRuntimeName,
    HotSuite,
    HotWorkerResult,
    HotCoverageLedgerEntry,
    HotDiagnosticKind,
    HotRunDiagnostics,
    HotRuntimeEvent,
    RunHotSuiteOptions,
    V8Tier
} from "./types.js";
import { collectHotTargets, loadHotSuite } from "./worker-shared.js";
import { bunWorkerConfigPath, resolveRuntimeWorker } from "./runtime-worker.js";
import { parseWorkerResult } from "./trace.js";
import { checkV8Deoptimizations } from "./runtime-oracles/v8-deoptimization/check.js";
import { checkWorkerLiveness } from "./runtime-oracles/worker-liveness/check.js";
import type { HotProblemOccurrence } from "./problems/types.js";
import { checkModuleGraph } from "./problems/module-graph/check.js";
import { hotObligationTargetId } from "./public-target/index.js";
import {
    beginHotArtifactBundle,
    assertHotArtifactOutputPaths,
    finalizeHotArtifactBundle,
    hotArtifactRunPath,
    type HotArtifactWorkspace
} from "./artifacts/index.js";
import {
    authenticateCpuOwners,
    parseCpuProfile
} from "./runtime-oracles/cpu-hotness/parse.js";
import { parseV8IcMapLog } from "./runtime-oracles/v8-ic-maps/parse.js";
import { checkV8IcMapDiagnostics } from "./runtime-oracles/v8-ic-maps/check.js";
import { parseV8Deoptimization } from "./runtime-oracles/v8-deoptimization/report.js";

const DEFAULT_MAX_BUFFER = 64 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 60_000;
const resolutionChangingArgument =
    /^(?:--conditions(?:=|$)|-C|--no-addons(?:=|$)|--preserve-symlinks(?:-main)?(?:=|$)|--(?:experimental-)?loader(?:=|$)|--require(?:=|$)|-r|--import(?:=|$)|--import-map(?:=|$)|--vendor(?:=|$)|--node-modules-dir(?:=|$)|--unstable-sloppy-imports(?:=|$)|--preload(?:=|$)|--config(?:=|$)|--experimental-config-file(?:=|$)|--tsconfig-override(?:=|$)|--bunfile(?:=|$))/u;
const localRequire = createRequire(import.meta.url);
const tsxLoaderUrl = pathToFileURL(localRequire.resolve("tsx")).href;
const oxcNativeBindings = discoverOxcNativeBindings(localRequire);
const allowedDiagnostics: readonly HotDiagnosticKind[] = [
    "v8-ic-maps",
    "cpu-profile",
    "jsc-sampling"
];

interface MatrixCell {
    runtime: HotRuntimeName;
    tier: V8Tier | "jsc";
    mode: HotRunMode;
    scenarios: readonly string[];
    repetition: number;
}

const asSuiteUrl = (suite: string | URL) => {
    if (suite instanceof URL) return suite;
    if (suite.startsWith("file:")) return new URL(suite);
    return pathToFileURL(resolve(suite));
};

const positiveInteger = (value: number, name: string) => {
    if (!Number.isSafeInteger(value) || value <= 0) {
        throw new Error(`${name} must be a positive integer`);
    }
    return value;
};

const unique = <Value>(values: readonly Value[]) => [...new Set(values)];

const suiteWorkerLoader = (suite: HotSuite) =>
    suite.workerLoader ?? suite.analysis?.sourceLoader;

const assertAllowed = <Value extends string>(
    values: readonly Value[],
    allowed: readonly Value[],
    name: string
) => {
    for (const value of values) {
        if (!allowed.includes(value)) {
            throw new Error(
                `Unknown ${name} ${value}; expected ${allowed.join(", ")}`
            );
        }
    }
};

const containsResolutionChangingArgument = (value: string) =>
    value
        .split(/\s+/u)
        .some(argument => resolutionChangingArgument.test(argument));

const assertStaticGraphResolutionContract = (
    suite: HotSuite<unknown>,
    runtimes: readonly HotRuntimeName[],
    options: RunHotSuiteOptions,
    environment: Readonly<Record<string, string>>
) => {
    if (suite.analysis?.runtime === undefined) return;
    for (const runtime of runtimes) {
        const argument = options.runtimeArgs?.[runtime]?.find(
            resolutionChangingArgument.test.bind(resolutionChangingArgument)
        );
        if (argument !== undefined) {
            throw new Error(
                `Runtime argument ${argument} changes ${runtime} module resolution, but this suite contains a static graph analyzed with the default condition set; generate a separate evidence plan for custom conditions`
            );
        }
        const optionVariables =
            runtime === "node"
                ? ["NODE_OPTIONS"]
                : runtime === "deno"
                  ? ["DENO_CONDITIONS"]
                  : ["BUN_OPTIONS"];
        if (runtime === "node") optionVariables.push("NODE_PRESERVE_SYMLINKS");
        for (const name of optionVariables) {
            const value = environment[name] ?? process.env[name];
            const changesResolution =
                name === "DENO_CONDITIONS"
                    ? Boolean(value?.trim())
                    : name === "NODE_PRESERVE_SYMLINKS"
                      ? value === "1"
                      : value !== undefined &&
                        containsResolutionChangingArgument(value);
            if (changesResolution) {
                throw new Error(
                    `${name} changes ${runtime} module resolution, but this suite contains a static graph analyzed with the default condition set; generate a separate evidence plan for custom conditions`
                );
            }
        }
    }
};

const createMatrix = (
    runtimes: readonly HotRuntimeName[],
    tiers: readonly V8Tier[],
    modes: readonly HotRunMode[],
    scenarioIds: readonly string[],
    repetitions: number
) => {
    const cells: MatrixCell[] = [];
    for (const runtime of runtimes) {
        const runtimeTiers: readonly (V8Tier | "jsc")[] =
            runtime === "bun" ? ["jsc"] : tiers;
        for (const tier of runtimeTiers) {
            for (const mode of modes) {
                const selections =
                    mode === "combined"
                        ? [scenarioIds]
                        : scenarioIds.map(id => [id]);
                for (const scenarios of selections) {
                    for (
                        let repetition = 1;
                        repetition <= repetitions;
                        repetition++
                    ) {
                        cells.push({
                            runtime,
                            tier,
                            mode,
                            scenarios,
                            repetition
                        });
                    }
                }
            }
        }
    }
    return cells;
};

const createCommand = (
    cell: MatrixCell,
    request: HotWorkerRequest,
    options: RunHotSuiteOptions,
    environment: Readonly<Record<string, string>>,
    sourceLoader: "tsx" | undefined
) => {
    const executable =
        options.executables?.[cell.runtime] ??
        (cell.runtime === "node"
            ? (process.env.CHECK_HOT_NODE ?? process.execPath)
            : cell.runtime === "deno"
              ? (process.env.CHECK_HOT_DENO ?? "deno")
              : (process.env.CHECK_HOT_BUN ?? "bun"));
    const extra = [...(options.runtimeArgs?.[cell.runtime] ?? [])];
    const worker = resolveRuntimeWorker(
        new URL(
            cell.runtime === "bun" ? "./workers/jsc.js" : "./workers/v8.js",
            import.meta.url
        )
    );
    const sourceWorker = worker.endsWith(".ts") ? worker : undefined;
    const sourceLoaderArguments =
        cell.runtime === "node" &&
        (sourceWorker !== undefined ||
            sourceLoader === "tsx" ||
            /\.(?:[cm]?ts|tsx)(?:$|[?#])/u.test(request.suiteUrl))
            ? [`--import=${tsxLoaderUrl}`]
            : [];
    const serializedRequest = JSON.stringify(request);

    if (cell.runtime === "node") {
        const flags = [
            "--allow-natives-syntax",
            "--trace-opt",
            "--trace-deopt",
            "--trace-file-names"
        ];
        if (cell.tier === "maglev") {
            flags.push("--optimize-on-next-call-optimizes-to-maglev");
        }
        return [
            executable,
            ...flags,
            ...sourceLoaderArguments,
            ...extra,
            worker,
            serializedRequest
        ];
    }

    if (cell.runtime === "deno") {
        const v8Flags = [
            "--allow-natives-syntax",
            "--trace-opt",
            "--trace-deopt",
            "--trace-file-names"
        ];
        if (cell.tier === "maglev") {
            v8Flags.push("--optimize-on-next-call-optimizes-to-maglev");
        }
        const environmentNames = unique([
            ...Object.keys(environment),
            ...oxcNativeEnvironmentNames
        ]);
        const permissions = ["--allow-read", "--allow-sys=uid"];
        if (environmentNames.length > 0) {
            permissions.push(`--allow-env=${environmentNames.join(",")}`);
        }
        if (oxcNativeBindings.length > 0) {
            permissions.push(`--allow-ffi=${oxcNativeBindings.join(",")}`);
        }
        return [
            executable,
            "run",
            "--no-config",
            "--node-modules-dir=manual",
            ...permissions,
            `--v8-flags=${v8Flags.join(",")}`,
            ...extra,
            worker,
            serializedRequest
        ];
    }

    return [
        executable,
        "--no-env-file",
        `--config=${bunWorkerConfigPath}`,
        ...extra,
        worker,
        serializedRequest
    ];
};

const addCpuProfileFlags = (
    command: readonly string[],
    runtime: HotRuntimeName,
    directory: string,
    name: string
) => {
    const flags = [
        "--cpu-prof",
        `--cpu-prof-dir=${directory}`,
        `--cpu-prof-name=${name}`
    ];
    if (runtime === "deno") {
        return [command[0], command[1], ...flags, ...command.slice(2)];
    }
    return [command[0], ...flags, ...command.slice(1)];
};

const addV8LogFlags = (
    command: readonly string[],
    runtime: HotRuntimeName,
    logfile: string
) => {
    const flags = [
        "--log-ic",
        "--log-maps",
        "--log-maps-details",
        `--logfile=${logfile}`,
        "--no-logfile-per-isolate"
    ];
    if (runtime === "node") {
        return [command[0], ...flags, ...command.slice(1)];
    }
    if (runtime === "deno") {
        return command.map(argument =>
            argument.startsWith("--v8-flags=")
                ? `${argument},${flags.join(",")}`
                : argument
        );
    }
    return command;
};

const diagnosticArtifact = (artifactRoot: string | undefined, path: string) =>
    artifactRoot
        ? relative(artifactRoot, path).replaceAll("\\", "/")
        : undefined;

const collectDiagnosticProblems = (
    diagnostics: HotRunDiagnostics
): readonly HotProblemOccurrence[] => [
    ...(diagnostics.v8IcMaps
        ? checkV8IcMapDiagnostics(diagnostics.v8IcMaps)
        : []),
    ...(diagnostics.cpuProfile?.gap
        ? [
              {
                  problemId: "cpu-profile-diagnostic-gap" as const,
                  message: diagnostics.cpuProfile.gap
              }
          ]
        : []),
    ...(diagnostics.jscSampling?.gap
        ? [
              {
                  problemId: "jsc-sampling-diagnostic-gap" as const,
                  message: diagnostics.jscSampling.gap
              }
          ]
        : [])
];

const diagnosticGaps = (
    requested: readonly HotDiagnosticKind[],
    runtime: HotRuntimeName,
    reason: string,
    engineVersion = "unknown"
): HotRunDiagnostics => {
    const result: HotRunDiagnostics = {};
    if (requested.includes("v8-ic-maps")) {
        result.v8IcMaps = {
            oracleVersion: "1",
            engineVersion,
            events: [],
            graph: { maps: [], transitions: [], inlineCaches: [] },
            targetScope: {
                requestedTargetIds: [],
                matchedTargetIds: [],
                unmatchedTargetIds: [],
                ambiguousTargetIds: []
            },
            gap:
                runtime === "bun"
                    ? "V8 IC/Map diagnostics are unsupported on Bun/JavaScriptCore."
                    : reason
        };
    }
    if (requested.includes("cpu-profile")) {
        result.cpuProfile = {
            oracleVersion: "1",
            totalSamples: 0,
            unattributedSamples: 0,
            functions: [],
            unobservedCandidateIds: [],
            gap: reason
        };
    }
    if (requested.includes("jsc-sampling")) {
        result.jscSampling = {
            oracleVersion: "1",
            sampleIntervalMicroseconds: 100,
            totalSamples: 0,
            tiers: {},
            functions: "",
            bytecodes: "",
            stackTraces: [],
            stackTraceCount: 0,
            stackTracesTruncated: false,
            gap:
                runtime === "bun"
                    ? reason
                    : "JSC sampling diagnostics require Bun/JavaScriptCore."
        };
    }
    result.problems = collectDiagnosticProblems(result);
    return result;
};

const collectCellDiagnostics = async (
    cell: MatrixCell,
    request: HotWorkerRequest,
    suite: HotSuite<unknown>,
    worker: HotWorkerResult | undefined,
    options: RunHotSuiteOptions,
    environment: Readonly<Record<string, string>>,
    maxBufferBytes: number,
    timeoutMs: number,
    artifactRoot: string | undefined,
    diagnosticMaxBytes: number
): Promise<{
    diagnostics?: HotRunDiagnostics;
    events: readonly HotRuntimeEvent[];
}> => {
    const requested = options.diagnostics ?? [];
    if (requested.length === 0) return { events: [] };
    const temporary = artifactRoot
        ? undefined
        : await mkdtemp(join(tmpdir(), "check-hot-diagnostics-"));
    const root = artifactRoot ?? (temporary as string);
    const directory = join(root, hotArtifactRunPath(cell), "diagnostics");
    await mkdir(directory, { recursive: true });
    const diagnostics: HotRunDiagnostics = {};
    const diagnosticContextProblems: HotProblemOccurrence[] = [];
    const events: HotRuntimeEvent[] = [];
    const workerEnvironment = { ...process.env, ...environment };
    if (suite.analysis?.runtime !== undefined)
        delete workerEnvironment.NODE_PATH;
    const runDiagnostic = async (
        kind: HotDiagnosticKind,
        command: readonly string[]
    ) => {
        const execution = await executeProcess(command, {
            cwd: process.cwd(),
            environment: workerEnvironment,
            maxBufferBytes,
            timeoutMs
        });
        if (artifactRoot) {
            await Promise.all([
                writeFile(
                    join(directory, `${kind}.stdout.log`),
                    execution.stdout ?? ""
                ),
                writeFile(
                    join(directory, `${kind}.stderr.log`),
                    execution.stderr ?? ""
                ),
                writeFile(
                    join(directory, `${kind}.command.json`),
                    `${JSON.stringify(command, null, 2)}\n`
                )
            ]);
        }
        const diagnosticWorker = parseWorkerResult(
            execution.stdout ?? "",
            execution.stderr ?? ""
        );
        const expectedTargets = worker?.targets
            .map(target => target.id)
            .toSorted();
        const actualTargets = diagnosticWorker?.targets
            .map(target => target.id)
            .toSorted();
        const livenessProblems = checkWorkerLiveness({
            error: execution.error as (Error & { code?: string }) | undefined,
            status: execution.status,
            signal: execution.signal,
            resultFound: diagnosticWorker !== undefined,
            reportedProblemCount: diagnosticWorker?.problems.length,
            timeoutMs,
            label: `${kind} diagnostic worker`
        });
        const allowedVerdictProblems = new Set([
            "v8-tier-mismatch",
            "jsc-dfg-not-compiled",
            "jsc-reoptimization-during-stress"
        ]);
        const semanticProblems =
            diagnosticWorker?.problems.filter(
                problem => !allowedVerdictProblems.has(problem.problemId)
            ) ?? [];
        const gap =
            livenessProblems.length > 0
                ? livenessProblems.map(problem => problem.message).join("; ")
                : !diagnosticWorker
                  ? "Diagnostic process produced no structured worker result."
                  : !worker
                    ? "Primary process produced no target/runtime identity for diagnostic correlation."
                    : semanticProblems.length > 0
                      ? `Diagnostic worker reported: ${diagnosticWorker.problems.map(problem => problem.message).join("; ")}`
                      : diagnosticWorker.runtime.name !== cell.runtime ||
                          diagnosticWorker.runtime.version !==
                              worker.runtime.version ||
                          diagnosticWorker.runtime.engine !==
                              worker.runtime.engine ||
                          diagnosticWorker.runtime.engineVersion !==
                              worker.runtime.engineVersion ||
                          diagnosticWorker.runtime.oracleId !==
                              worker.runtime.oracleId ||
                          diagnosticWorker.runtime.oracleVersion !==
                              worker.runtime.oracleVersion ||
                          diagnosticWorker.runtime.tier !==
                              worker.runtime.tier ||
                          diagnosticWorker.runtime.tier !== cell.tier
                        ? "Diagnostic worker runtime/engine identity differs from the primary process."
                        : JSON.stringify(diagnosticWorker.scenarios) !==
                            JSON.stringify(request.scenarios)
                          ? "Diagnostic worker exercised a different scenario selection."
                          : JSON.stringify(actualTargets) !==
                              JSON.stringify(expectedTargets)
                            ? "Diagnostic worker resolved different target identities."
                            : undefined;
        if (!gap && diagnosticWorker) {
            diagnosticContextProblems.push(
                ...diagnosticWorker.problems.filter(problem =>
                    allowedVerdictProblems.has(problem.problemId)
                )
            );
        }
        return { execution, diagnosticWorker, gap };
    };
    try {
        for (const kind of requested) {
            const diagnosticRequest: HotWorkerRequest = {
                ...request,
                purpose: "diagnostic",
                diagnostic: kind,
                stressIterations:
                    options.diagnosticStressIterations?.[kind] ??
                    request.stressIterations
            };
            let command: readonly string[] = createCommand(
                cell,
                diagnosticRequest,
                options,
                environment,
                suiteWorkerLoader(suite)
            );
            if (kind === "v8-ic-maps") {
                if (cell.runtime === "bun") {
                    Object.assign(
                        diagnostics,
                        diagnosticGaps(
                            [kind],
                            cell.runtime,
                            "",
                            worker?.runtime.engineVersion
                        )
                    );
                    continue;
                }
                const logfile = join(directory, "v8.log");
                command = addV8LogFlags(command, cell.runtime, logfile);
                // oxlint-disable-next-line no-await-in-loop -- Each diagnostic is a separate process so it cannot perturb another evidence stream.
                const diagnosticRun = await runDiagnostic(kind, command);
                events.push(...(diagnosticRun.diagnosticWorker?.events ?? []));
                if (diagnosticRun.gap) {
                    const requestedTargetIds =
                        worker?.targets.map(target => target.id) ?? [];
                    diagnostics.v8IcMaps = {
                        oracleVersion: "1",
                        engineVersion:
                            worker?.runtime.engineVersion ?? "unknown",
                        events: [],
                        graph: { maps: [], transitions: [], inlineCaches: [] },
                        targetScope: {
                            requestedTargetIds,
                            matchedTargetIds: [],
                            unmatchedTargetIds: requestedTargetIds,
                            ambiguousTargetIds: []
                        },
                        gap: diagnosticRun.gap
                    };
                    continue;
                }
                try {
                    // oxlint-disable-next-line no-await-in-loop -- The cap is checked after the diagnostic process closes its log.
                    const info = await stat(logfile);
                    if (info.size > diagnosticMaxBytes) {
                        diagnostics.v8IcMaps = {
                            oracleVersion: "1",
                            engineVersion:
                                worker?.runtime.engineVersion ?? "unknown",
                            events: [],
                            graph: {
                                maps: [],
                                transitions: [],
                                inlineCaches: []
                            },
                            targetScope: {
                                requestedTargetIds:
                                    worker?.targets.map(target => target.id) ??
                                    [],
                                matchedTargetIds: [],
                                unmatchedTargetIds:
                                    worker?.targets.map(target => target.id) ??
                                    [],
                                ambiguousTargetIds: []
                            },
                            artifact: diagnosticArtifact(artifactRoot, logfile),
                            gap: `V8 log is ${info.size} bytes, above diagnosticMaxBytes=${diagnosticMaxBytes}; ${artifactRoot ? "the raw artifact was retained" : "the temporary raw artifact will be deleted"} and was not loaded into memory.`
                        };
                        continue;
                    }
                    // oxlint-disable-next-line no-await-in-loop -- The worker must close the V8 log before its complete graph is parsed.
                    const raw = await readFile(logfile, "utf8");
                    const parsed = parseV8IcMapLog(
                        raw,
                        worker?.runtime.engineVersion ?? "unknown",
                        `diagnostic:v8-ic-maps:${cell.repetition}`,
                        worker?.targets.map(target => {
                            const obligation = suite.obligations?.find(
                                candidate =>
                                    hotObligationTargetId(candidate) ===
                                    target.id
                            );
                            const evidence = suite.evidence?.find(
                                candidate =>
                                    candidate.id === obligation?.evidenceId
                            );
                            const owner =
                                evidence &&
                                /\.(?:[cm]?js)$/u.test(evidence.ownerSpan.file)
                                    ? evidence.ownerSpan
                                    : undefined;
                            const runtimeLocation =
                                owner &&
                                evidence?.runtimeLocations?.v8CodeCreation
                                    ?.sourceSha256 === owner.sourceSha256
                                    ? evidence.runtimeLocations.v8CodeCreation
                                    : undefined;
                            return {
                                targetId: target.id,
                                functionName: target.functionName,
                                sourceFile: owner?.file,
                                runtimeLocation
                            };
                        }) ?? []
                    );
                    parsed.artifact = diagnosticArtifact(artifactRoot, logfile);
                    diagnostics.v8IcMaps = parsed;
                    events.push(...parsed.events);
                } catch (error) {
                    diagnostics.v8IcMaps = {
                        oracleVersion: "1",
                        engineVersion:
                            worker?.runtime.engineVersion ?? "unknown",
                        events: [],
                        graph: { maps: [], transitions: [], inlineCaches: [] },
                        targetScope: {
                            requestedTargetIds:
                                worker?.targets.map(target => target.id) ?? [],
                            matchedTargetIds: [],
                            unmatchedTargetIds:
                                worker?.targets.map(target => target.id) ?? [],
                            ambiguousTargetIds: []
                        },
                        gap: `V8 log collection failed: ${error instanceof Error ? error.message : String(error)}`
                    };
                }
                continue;
            }
            if (kind === "cpu-profile") {
                const profileName = "cpu.cpuprofile";
                const profilePath = join(directory, profileName);
                command = addCpuProfileFlags(
                    command,
                    cell.runtime,
                    directory,
                    profileName
                );
                // oxlint-disable-next-line no-await-in-loop -- Sampling is isolated in its own non-gating process.
                const diagnosticRun = await runDiagnostic(kind, command);
                events.push(...(diagnosticRun.diagnosticWorker?.events ?? []));
                if (diagnosticRun.gap) {
                    diagnostics.cpuProfile = {
                        oracleVersion: "1",
                        totalSamples: 0,
                        unattributedSamples: 0,
                        functions: [],
                        unobservedCandidateIds: [],
                        gap: diagnosticRun.gap
                    };
                    continue;
                }
                try {
                    // oxlint-disable-next-line no-await-in-loop -- The cap is checked after the profiler closes its output.
                    const info = await stat(profilePath);
                    if (info.size > diagnosticMaxBytes) {
                        diagnostics.cpuProfile = {
                            oracleVersion: "1",
                            totalSamples: 0,
                            unattributedSamples: 0,
                            functions: [],
                            unobservedCandidateIds: [],
                            artifact: diagnosticArtifact(
                                artifactRoot,
                                profilePath
                            ),
                            gap: `CPU profile is ${info.size} bytes, above diagnosticMaxBytes=${diagnosticMaxBytes}; ${artifactRoot ? "it was retained" : "the temporary profile will be deleted"} and was not loaded into memory.`
                        };
                        continue;
                    }
                    // oxlint-disable-next-line no-await-in-loop -- Each diagnostic rerun remains sequential and authenticates the sources used by its completed profile.
                    const owners = await authenticateCpuOwners(
                        suite.evidence ?? []
                    );
                    // oxlint-disable-next-line no-await-in-loop -- Profile output is complete only after the runtime exits.
                    const raw = await readFile(profilePath, "utf8");
                    const parsed = parseCpuProfile(raw, owners);
                    parsed.artifact = diagnosticArtifact(
                        artifactRoot,
                        profilePath
                    );
                    diagnostics.cpuProfile = parsed;
                    events.push({
                        sequence: 0,
                        streamId: `diagnostic:cpu-profile:${cell.repetition}`,
                        purpose: "diagnostic",
                        phase: "diagnostic",
                        kind: parsed.gap
                            ? "diagnostic-gap"
                            : "sampling-profile",
                        source: "cpu-profile",
                        correlation: "phase",
                        message:
                            parsed.gap ??
                            `CPU profile observed ${parsed.totalSamples} samples`
                    });
                } catch (error) {
                    diagnostics.cpuProfile = {
                        oracleVersion: "1",
                        totalSamples: 0,
                        unattributedSamples: 0,
                        functions: [],
                        unobservedCandidateIds: [],
                        gap: `CPU profile collection failed: ${error instanceof Error ? error.message : String(error)}`
                    };
                }
                continue;
            }
            if (cell.runtime !== "bun") {
                Object.assign(
                    diagnostics,
                    diagnosticGaps([kind], cell.runtime, "")
                );
                continue;
            }
            // oxlint-disable-next-line no-await-in-loop -- Bun sampling is isolated in a dedicated diagnostic process.
            const diagnosticRun = await runDiagnostic(kind, command);
            diagnostics.jscSampling = diagnosticRun.gap
                ? diagnosticGaps([kind], cell.runtime, diagnosticRun.gap)
                      .jscSampling
                : (diagnosticRun.diagnosticWorker?.diagnostics?.jscSampling ??
                  diagnosticGaps(
                      [kind],
                      cell.runtime,
                      "Diagnostic worker returned no JSC sampling result."
                  ).jscSampling);
            events.push(...(diagnosticRun.diagnosticWorker?.events ?? []));
        }
    } finally {
        if (temporary) {
            await rm(temporary, { recursive: true, force: true });
        }
    }
    diagnostics.problems = [
        ...new Map(
            [
                ...diagnosticContextProblems,
                ...collectDiagnosticProblems(diagnostics)
            ].map(problem => [
                JSON.stringify([
                    problem.problemId,
                    problem.targetId,
                    problem.message,
                    problem.detail
                ]),
                problem
            ])
        ).values()
    ];
    return {
        diagnostics:
            Object.keys(diagnostics).length > 0 ? diagnostics : undefined,
        events
    };
};

const executeCell = async (
    cell: MatrixCell,
    suiteUrl: URL,
    options: RunHotSuiteOptions,
    maxBufferBytes: number,
    deoptScope: "all" | "targets" | "none",
    timeoutMs: number,
    environment: Readonly<Record<string, string>>,
    suite: HotSuite<unknown>
): Promise<HotRunResult> => {
    const request: HotWorkerRequest = {
        suiteUrl: suiteUrl.href,
        scenarios: cell.scenarios,
        runtime: cell.runtime,
        tier: cell.tier,
        mode: cell.mode,
        inspect: options.inspect ?? false,
        warmupIterations: options.warmupIterations,
        stressIterations: options.stressIterations,
        purpose: "measurement"
    };
    const startedAt = performance.now();
    const lifecycleEvents: HotRuntimeEvent[] = [];
    const workerEnvironment = { ...process.env, ...environment };
    if (suite.analysis?.runtime !== undefined) {
        delete workerEnvironment.NODE_PATH;
    }
    if (typeof suite.preflight === "function") {
        const preflightRequest: HotWorkerRequest = {
            ...request,
            purpose: "preflight"
        };
        const preflightCommand = createCommand(
            cell,
            preflightRequest,
            options,
            environment,
            suiteWorkerLoader(suite)
        );
        const preflightExecution = await executeProcess(preflightCommand, {
            cwd: process.cwd(),
            environment: workerEnvironment,
            maxBufferBytes,
            timeoutMs
        });
        const preflightStdout = preflightExecution.stdout ?? "";
        const preflightStderr = preflightExecution.stderr ?? "";
        const preflightWorker = parseWorkerResult(
            preflightStdout,
            preflightStderr
        );
        lifecycleEvents.push(...(preflightWorker?.events ?? []));
        const preflightProblems: HotProblemOccurrence[] = [
            ...(preflightWorker?.problems ?? []),
            ...checkWorkerLiveness({
                error: preflightExecution.error as
                    | (Error & { code?: string })
                    | undefined,
                status: preflightExecution.status,
                signal: preflightExecution.signal,
                resultFound: preflightWorker !== undefined,
                reportedProblemCount: preflightWorker?.problems.length,
                timeoutMs,
                label: "Semantic preflight"
            })
        ];
        if (preflightProblems.length > 0) {
            const reason = preflightProblems
                .map(problem => problem.message)
                .join("; ");
            const coverage = (suite.obligations ?? []).map(obligation => ({
                obligationId: obligation.id,
                status: "failed" as const,
                reason: `Semantic preflight process failed: ${reason}`,
                scenarios: [],
                evidence: suite.evidence?.find(
                    item => item.id === obligation.evidenceId
                )
            }));
            return {
                ...cell,
                durationMs: Math.round(performance.now() - startedAt),
                passed: false,
                coverage,
                deoptimizations: [],
                problems: preflightProblems,
                stdout: preflightStdout,
                stderr: preflightStderr,
                command: preflightCommand,
                events: lifecycleEvents,
                diagnostics: diagnosticGaps(
                    options.diagnostics ?? [],
                    cell.runtime,
                    "Diagnostics were not run because semantic preflight failed.",
                    preflightWorker?.runtime.engineVersion
                )
            };
        }
        request.preflightOutcomes = preflightWorker?.preflight ?? [];
        if (
            cell.runtime === "node" &&
            request.preflightOutcomes.some(
                outcome => outcome.status === "accepted"
            )
        ) {
            const validationRequest: HotWorkerRequest = {
                ...request,
                purpose: "validation"
            };
            const validationCommand = createCommand(
                cell,
                validationRequest,
                options,
                environment,
                suiteWorkerLoader(suite)
            );
            const validationExecution = await executeProcess(
                validationCommand,
                {
                    cwd: process.cwd(),
                    environment: workerEnvironment,
                    maxBufferBytes,
                    timeoutMs
                }
            );
            const validationStdout = validationExecution.stdout ?? "";
            const validationStderr = validationExecution.stderr ?? "";
            const validationWorker = parseWorkerResult(
                validationStdout,
                validationStderr
            );
            lifecycleEvents.push(...(validationWorker?.events ?? []));
            const validationProblems: HotProblemOccurrence[] = [
                ...(validationWorker?.problems ?? []),
                ...checkWorkerLiveness({
                    error: validationExecution.error as
                        | (Error & { code?: string })
                        | undefined,
                    status: validationExecution.status,
                    signal: validationExecution.signal,
                    resultFound: validationWorker !== undefined,
                    reportedProblemCount: validationWorker?.problems.length,
                    timeoutMs,
                    label: "Guarded AST-site validation"
                })
            ];
            if (validationProblems.length > 0) {
                const reason = validationProblems
                    .map(problem => problem.message)
                    .join("; ");
                const coverage = (suite.obligations ?? []).map(obligation => ({
                    obligationId: obligation.id,
                    status: "failed" as const,
                    reason: `Guarded AST-site lifecycle validation failed: ${reason}`,
                    scenarios: [],
                    evidence: suite.evidence?.find(
                        item => item.id === obligation.evidenceId
                    )
                }));
                return {
                    ...cell,
                    durationMs: Math.round(performance.now() - startedAt),
                    passed: false,
                    coverage,
                    deoptimizations: [],
                    problems: validationProblems,
                    stdout: validationStdout,
                    stderr: validationStderr,
                    command: validationCommand,
                    events: lifecycleEvents,
                    diagnostics: diagnosticGaps(
                        options.diagnostics ?? [],
                        cell.runtime,
                        "Diagnostics were not run because guarded AST-site validation failed.",
                        validationWorker?.runtime.engineVersion
                    )
                };
            }
            request.preflightOutcomes = validationWorker?.preflight ?? [];
        }
    }
    const command = createCommand(
        cell,
        request,
        options,
        environment,
        suiteWorkerLoader(suite)
    );
    const execution = await executeProcess(command, {
        cwd: process.cwd(),
        environment: workerEnvironment,
        maxBufferBytes,
        timeoutMs
    });
    const durationMs = Math.round(performance.now() - startedAt);
    const stdout = execution.stdout ?? "";
    const stderr = execution.stderr ?? "";
    const worker = parseWorkerResult(stdout, stderr);
    const problems: HotProblemOccurrence[] = [...(worker?.problems ?? [])];
    const livenessProblems = checkWorkerLiveness({
        error: execution.error as (Error & { code?: string }) | undefined,
        status: execution.status,
        signal: execution.signal,
        resultFound: worker !== undefined,
        reportedProblemCount: worker?.problems.length,
        timeoutMs
    });
    problems.push(...livenessProblems);

    let deoptimizations: string[] = [];
    if (cell.runtime !== "bun" && deoptScope !== "none") {
        const deoptimizationCheck = checkV8Deoptimizations(
            [stdout, stderr],
            deoptScope,
            worker?.targets.map(target => target.functionName) ?? []
        );
        problems.push(...deoptimizationCheck.problems);
        deoptimizations = [...deoptimizationCheck.deoptimizations];
    }

    let accountedWorker = worker;
    if (worker && problems.length > 0) {
        const coverage: HotWorkerResult["coverage"][number][] = [];
        for (const entry of worker.coverage) {
            coverage.push(
                entry.status === "passed"
                    ? {
                          ...entry,
                          status: "failed" as const,
                          reason: "The worker scenario completed, but the orchestrator runtime/deoptimization oracle failed"
                      }
                    : entry
            );
        }
        accountedWorker = { ...worker, coverage };
    }

    const deoptimizationEvents: HotRuntimeEvent[] = deoptimizations.map(
        (detail, sequence) => {
            const parsed = parseV8Deoptimization(detail);
            const target = accountedWorker?.targets.find(
                candidate => candidate.functionName === parsed.functionName
            );
            return {
                sequence,
                streamId: "measurement:v8-trace",
                purpose: "measurement",
                phase: "stress",
                kind: "deoptimization",
                source: "v8-log",
                correlation: target ? "name-only" : "unavailable",
                targetId: target?.id,
                functionName: parsed.functionName,
                message: parsed.reason,
                detail
            };
        }
    );
    return {
        ...cell,
        durationMs,
        passed: problems.length === 0,
        worker: accountedWorker,
        coverage:
            accountedWorker?.coverage ??
            (suite.obligations ?? []).map(obligation => ({
                obligationId: obligation.id,
                status: "failed" as const,
                reason: `Measurement worker failed before terminal obligation accounting: ${problems.map(problem => problem.message).join("; ")}`,
                scenarios: [],
                evidence: suite.evidence?.find(
                    item => item.id === obligation.evidenceId
                )
            })),
        deoptimizations,
        problems,
        stdout,
        stderr,
        command,
        events: [
            ...lifecycleEvents,
            ...(accountedWorker?.events ?? []),
            ...deoptimizationEvents
        ]
    };
};

/** Execute a suite across fresh runtime/tier/isolation matrix processes. */
export const runHotSuite = async (
    options: RunHotSuiteOptions
): Promise<HotRunSummary> => {
    if (options.artifactOutput) {
        assertHotArtifactOutputPaths(
            options.artifactOutput,
            options.jsonOutput
        );
    }
    const suiteUrl = asSuiteUrl(options.suite);
    const suite = await loadHotSuite(suiteUrl.href);
    const runtimes = unique<HotRuntimeName>(
        options.runtimes ?? suite.options?.runtimes ?? ["node"]
    );
    const tiers = unique<V8Tier>(
        options.v8Tiers ?? suite.options?.v8Tiers ?? ["maglev", "turbofan"]
    );
    const modes = unique<HotRunMode>(
        options.modes ?? suite.options?.modes ?? ["combined", "isolated"]
    );
    const repetitions = positiveInteger(
        options.repetitions ?? suite.options?.repetitions ?? 1,
        "repetitions"
    );
    const concurrency = positiveInteger(
        options.concurrency ?? 1,
        "concurrency"
    );
    if (options.warmupIterations !== undefined) {
        positiveInteger(options.warmupIterations, "warmupIterations");
    }
    if (options.stressIterations !== undefined) {
        positiveInteger(options.stressIterations, "stressIterations");
    }
    if (options.diagnosticMaxBytes !== undefined) {
        positiveInteger(options.diagnosticMaxBytes, "diagnosticMaxBytes");
    }
    if (options.diagnosticStressIterations) {
        const configuredKinds = Object.keys(
            options.diagnosticStressIterations
        ) as HotDiagnosticKind[];
        assertAllowed(
            configuredKinds,
            allowedDiagnostics,
            "diagnostic stress runtime"
        );
        for (const kind of configuredKinds) {
            const stressIterations = options.diagnosticStressIterations[kind];
            if (stressIterations === undefined) {
                throw new Error(
                    `diagnosticStressIterations.${kind} must be a positive integer`
                );
            }
            positiveInteger(
                stressIterations,
                `diagnosticStressIterations.${kind}`
            );
        }
    }
    const diagnostics = unique(options.diagnostics ?? []);
    assertAllowed(diagnostics, allowedDiagnostics, "diagnostic");
    if (runtimes.length === 0 || modes.length === 0 || tiers.length === 0) {
        throw new Error("Runtime, mode, and V8 tier lists must not be empty");
    }
    assertAllowed(runtimes, ["node", "deno", "bun"], "runtime");
    if (
        suite.analysis?.runtime !== undefined &&
        runtimes.some(runtime => runtime !== suite.analysis?.runtime)
    ) {
        throw new Error(
            `Suite evidence was analyzed for ${suite.analysis.runtime}; runtime overrides require a separately generated evidence plan`
        );
    }
    assertAllowed(modes, ["combined", "isolated"], "mode");
    assertAllowed(tiers, ["maglev", "turbofan"], "V8 tier");
    const declaredScenarioIds = suite.scenarios.map(scenario => scenario.id);
    if (declaredScenarioIds.length === 0)
        throw new Error("Hot suite has no scenarios");
    const scenarioIds = unique(options.scenarios ?? declaredScenarioIds);
    if (scenarioIds.length === 0)
        throw new Error("Selected scenario list must not be empty");
    for (const scenarioId of scenarioIds) {
        if (!declaredScenarioIds.includes(scenarioId)) {
            throw new Error(`Unknown hot scenario ${scenarioId}`);
        }
    }

    const annotationContractProblems = suite.annotations
        ? await validateHotAnnotations(
              suite.annotations,
              [...collectHotTargets(suite).values()],
              suiteUrl
          )
        : [];
    const maxBufferBytes = positiveInteger(
        options.maxBufferBytes ??
            suite.options?.maxBufferBytes ??
            DEFAULT_MAX_BUFFER,
        "maxBufferBytes"
    );
    const timeoutMs = positiveInteger(
        options.timeoutMs ?? suite.options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        "timeoutMs"
    );
    const environment = suite.environment ?? {};
    for (const name of Object.keys(environment)) {
        if (!name || name.includes(",") || name.includes("=")) {
            throw new Error(`Invalid worker environment variable name ${name}`);
        }
    }
    assertStaticGraphResolutionContract(suite, runtimes, options, environment);
    const deoptScope =
        options.deoptScope ?? suite.options?.deoptScope ?? "targets";
    assertAllowed(
        [deoptScope],
        ["all", "targets", "none"],
        "deoptimization scope"
    );
    const matrix = createMatrix(
        runtimes,
        tiers,
        modes,
        scenarioIds,
        repetitions
    );
    const artifactWorkspace: HotArtifactWorkspace | undefined =
        options.artifactOutput
            ? await beginHotArtifactBundle(options.artifactOutput)
            : undefined;
    let runs: readonly HotRunResult[];
    try {
        const primaryRuns = await mapWithConcurrency(
            matrix,
            concurrency,
            cell =>
                executeCell(
                    cell,
                    suiteUrl,
                    { ...options, diagnostics: [] },
                    maxBufferBytes,
                    deoptScope,
                    timeoutMs,
                    environment,
                    suite
                )
        );
        runs =
            diagnostics.length === 0
                ? primaryRuns
                : await mapWithConcurrency(
                      matrix,
                      concurrency,
                      async (cell, index) => {
                          const run = primaryRuns[index];
                          if (!run.worker) {
                              return {
                                  ...run,
                                  diagnostics: diagnosticGaps(
                                      diagnostics,
                                      cell.runtime,
                                      "Diagnostics were not run because the primary worker produced no authenticated target identity."
                                  )
                              };
                          }
                          const preflightOutcomes = [
                              ...new Map(
                                  run.coverage.flatMap(entry =>
                                      entry.preflight
                                          ? [
                                                [
                                                    `${entry.preflight.obligationId}:${entry.preflight.scenarioId}`,
                                                    entry.preflight
                                                ] as const
                                            ]
                                          : []
                                  )
                              ).values()
                          ];
                          const request: HotWorkerRequest = {
                              suiteUrl: suiteUrl.href,
                              scenarios: cell.scenarios,
                              runtime: cell.runtime,
                              tier: cell.tier,
                              mode: cell.mode,
                              inspect: options.inspect ?? false,
                              warmupIterations: options.warmupIterations,
                              stressIterations: options.stressIterations,
                              purpose: "measurement",
                              preflightOutcomes
                          };
                          try {
                              const collected = await collectCellDiagnostics(
                                  cell,
                                  request,
                                  suite,
                                  run.worker,
                                  { ...options, diagnostics },
                                  environment,
                                  maxBufferBytes,
                                  timeoutMs,
                                  artifactWorkspace?.staging,
                                  options.diagnosticMaxBytes ?? 64 * 1024 * 1024
                              );
                              return {
                                  ...run,
                                  events: [...run.events, ...collected.events],
                                  diagnostics: collected.diagnostics
                              };
                          } catch (error) {
                              return {
                                  ...run,
                                  diagnostics: diagnosticGaps(
                                      diagnostics,
                                      cell.runtime,
                                      `Diagnostic collection failed: ${error instanceof Error ? error.message : String(error)}`,
                                      run.worker.runtime.engineVersion
                                  )
                              };
                          }
                      }
                  );
    } catch (error) {
        if (artifactWorkspace) {
            await rm(artifactWorkspace.staging, {
                recursive: true,
                force: true
            });
        }
        throw error;
    }
    const summaryProblems: HotProblemOccurrence[] = [
        ...annotationContractProblems
    ];
    if (suite.analysis) {
        const graphProblem = checkModuleGraph(
            suite.analysis.graphComplete,
            suite.analysis.diagnostics
        );
        if (graphProblem) summaryProblems.push(graphProblem);
    }
    const coverageByCell = new Map<
        string,
        Map<string, HotCoverageLedgerEntry[]>
    >();
    for (const run of runs) {
        const key = `${run.runtime}/${run.tier}/${run.mode}/run-${run.repetition}`;
        const byObligation = coverageByCell.get(key) ?? new Map();
        coverageByCell.set(key, byObligation);
        for (const entry of run.coverage) {
            const entries = byObligation.get(entry.obligationId) ?? [];
            entries.push(entry);
            byObligation.set(entry.obligationId, entries);
        }
    }
    for (const obligation of suite.obligations ?? []) {
        for (const [cell, byObligation] of coverageByCell) {
            const entries = byObligation.get(obligation.id) ?? [];
            if (
                entries.length > 0 &&
                entries.every(entry => entry.status === "ignored")
            ) {
                continue;
            }
            if (!entries.some(entry => entry.status === "passed")) {
                const reasons = [
                    ...new Set(
                        entries
                            .filter(entry => entry.status !== "ignored")
                            .map(entry => `${entry.status}: ${entry.reason}`)
                    )
                ];
                const statuses = entries.map(entry => entry.status);
                summaryProblems.push({
                    problemId: statuses.includes("failed")
                        ? "coverage-obligation-failed"
                        : statuses.length > 0 &&
                            statuses.every(status => status === "unsupported")
                          ? "coverage-obligation-unsupported"
                          : "coverage-obligation-blocked",
                    targetId: obligation.id,
                    message: `${obligation.id} has no passing ${obligation.mutationFamily} scenario in ${cell}${reasons.length > 0 ? ` (${reasons.join("; ")})` : ""}`
                });
            }
        }
    }
    const summary: HotRunSummary = {
        suite: suite.name,
        runs,
        problems: summaryProblems,
        coverageComplete: !summaryProblems.some(
            problem =>
                problem.problemId.startsWith("coverage-") ||
                problem.problemId === "analysis-module-graph-incomplete"
        ),
        passed: summaryProblems.length === 0 && runs.every(run => run.passed),
        artifactSchemaVersion: artifactWorkspace ? "1" : undefined
    };

    if (artifactWorkspace) {
        await finalizeHotArtifactBundle(artifactWorkspace, summary, suite);
    }

    if (options.jsonOutput) {
        const outputPath = resolve(options.jsonOutput);
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
    }
    return summary;
};
