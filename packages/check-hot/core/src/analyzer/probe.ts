import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

import type {
    HotModuleCoverageClaim,
    HotModuleProbeAttempt,
    HotModuleProbeManifest,
    HotModuleRuntime
} from "../module-suite.js";
import type {
    HotPackageTreeIdentity,
    HotRuntimeName,
    HotSourceFileIdentity
} from "../types.js";
import { mapWithConcurrency } from "../concurrency.js";
import {
    discoverOxcNativeBindings,
    oxcNativeEnvironmentNames
} from "../oxc-runtime.js";
import { executeProcess } from "../process-execution.js";
import {
    bunWorkerConfigPath,
    resolveRuntimeWorker
} from "../runtime-worker.js";
import { resolveSourceRequestSync } from "./resolution.js";

/** Options for isolated runtime sampling used by `init --probe`. */
export interface ProbeHotModuleOptions {
    /** Package name or file URL importable by the child process. */
    specifier: string;
    /** Consumer module URL used to resolve bare package exports. */
    parentUrl: string;
    /** Resolved external test-runner module or file URL. */
    testRunnerSpecifier: string;
    /** Package identity checked by the external test runner. */
    package: {
        /** Package name from static manifest discovery. */
        name?: string;
        /** Exact package version from static manifest discovery. */
        version?: string;
    };
    /** Hard wall-clock timeout for discovery and for each isolated attempt. */
    timeoutMs?: number;
    /** Maximum recipe coordinates probed concurrently; defaults to one. */
    concurrency?: number;
    /** Runtime whose conditional exports and semantics are probed. */
    runtime?: HotRuntimeName;
    /** Runtime executable override. */
    executable?: string;
    /** Public runtime function names to expose to recipe discovery. */
    functions?: readonly string[];
    /** Public package entry whose local export names are being probed. */
    modulePath?: string;
}

interface DiscoveryResult {
    kind: "discovery";
    runnerId: string;
    runnerVersion: string;
    package: ProbeHotModuleOptions["package"];
    runtime: HotModuleRuntime;
    perSampleTimeoutMs: number;
    runnerPackageTree: HotPackageTreeIdentity;
    runnerEntryPackagePath: string;
    runnerSourceGraph: readonly HotSourceFileIdentity[];
    coordinates: readonly {
        functionName: string;
        label: string;
        targetSourceSha256: string;
        coverage: readonly HotModuleCoverageClaim[];
    }[];
}

interface AttemptResult {
    kind: "attempt";
    functionName: string;
    label: string;
    status: "accepted" | "threw" | "unsupported";
    fingerprint?: string;
    stage?: HotModuleProbeAttempt["stage"];
    error?: string;
}

const probeResultPrefix = "__CHECK_HOT_PROBE_RESULT__=";

const probeManifestSharedIdentity = (manifest: HotModuleProbeManifest) =>
    JSON.stringify({
        runnerId: manifest.runnerId,
        runnerVersion: manifest.runnerVersion,
        runnerSourceSha256: manifest.runnerSourceSha256,
        runnerEntryPackagePath: manifest.runnerEntryPackagePath,
        runnerSourceGraph: manifest.runnerSourceGraph,
        runnerPackageTree: manifest.runnerPackageTree,
        package: manifest.package,
        runtime: manifest.runtime
    });

/**
 * Import and sample module exports in one hard-timeout process per attempt.
 * Timers and modified globals disappear when each worker exits.
 */
export const probeHotModule = async (
    options: ProbeHotModuleOptions
): Promise<HotModuleProbeManifest> => {
    const timeout = options.timeoutMs ?? 15_000;
    if (!Number.isInteger(timeout) || timeout < 1) {
        throw new Error("probe timeout must be a positive integer");
    }
    const concurrency = options.concurrency ?? 1;
    if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
        throw new Error("probe concurrency must be a positive integer");
    }
    if (
        options.functions &&
        (options.functions.length === 0 ||
            new Set(options.functions).size !== options.functions.length ||
            options.functions.some(name => name.length === 0))
    ) {
        throw new Error(
            "probe functions must contain unique non-empty public names"
        );
    }
    const worker = resolveRuntimeWorker(
        new URL("../workers/probe.js", import.meta.url)
    );
    const runtime = options.runtime ?? "node";
    const isAbsoluteUrl = /^[a-zA-Z][a-zA-Z\d+.-]*:/u.test(options.specifier);
    const resolvedSpecifier = isAbsoluteUrl
        ? options.specifier
        : options.specifier.startsWith(".") || options.specifier.startsWith("/")
          ? new URL(options.specifier, options.parentUrl).href
          : (() => {
                const resolution = resolveSourceRequestSync(
                    fileURLToPath(options.parentUrl),
                    options.specifier,
                    runtime
                );
                if (!resolution.path) {
                    throw new Error(
                        `Unable to resolve probe target ${options.specifier} for ${runtime} ESM conditions: ${resolution.error ?? "no supported JS/TS source"}`
                    );
                }
                return pathToFileURL(resolution.path).href;
            })();
    const executable =
        options.executable ??
        (runtime === "node"
            ? (process.env.CHECK_HOT_NODE ?? process.execPath)
            : runtime === "deno"
              ? (process.env.CHECK_HOT_DENO ?? "deno")
              : (process.env.CHECK_HOT_BUN ?? "bun"));
    const localRequire = createRequire(import.meta.url);
    const tsxLoaderUrl = pathToFileURL(localRequire.resolve("tsx")).href;
    const oxcNativeBindings = discoverOxcNativeBindings(localRequire);
    const requiresSourceLoader =
        worker.endsWith(".ts") ||
        [resolvedSpecifier, options.testRunnerSpecifier].some(specifier =>
            /\.(?:[cm]?ts|tsx|jsx)(?:$|[?#])/u.test(specifier)
        );
    const testRunnerUrl = new URL(options.testRunnerSpecifier);
    if (testRunnerUrl.protocol !== "file:") {
        throw new Error(
            "Test runner must resolve to a local file URL so its probed artifact can be authenticated"
        );
    }
    const runnerSourceSha256 = createHash("sha256")
        .update(readFileSync(fileURLToPath(testRunnerUrl)))
        .digest("hex");
    const workerArguments = (request: object) => {
        const serialized = JSON.stringify(request);
        return runtime === "node"
            ? [
                  "--experimental-import-meta-resolve",
                  ...(requiresSourceLoader ? [`--import=${tsxLoaderUrl}`] : []),
                  worker,
                  serialized
              ]
            : runtime === "deno"
              ? [
                    "run",
                    "--no-config",
                    "--node-modules-dir=manual",
                    "--allow-read",
                    `--allow-env=${oxcNativeEnvironmentNames.join(",")}`,
                    "--allow-sys=uid",
                    ...(oxcNativeBindings.length > 0
                        ? [`--allow-ffi=${oxcNativeBindings.join(",")}`]
                        : []),
                    worker,
                    serialized
                ]
              : [
                    "--no-env-file",
                    `--config=${bunWorkerConfigPath}`,
                    worker,
                    serialized
                ];
    };
    const execute = async (request: object, processTimeout: number) => {
        const execution = await executeProcess(
            [executable, ...workerArguments(request)],
            {
                cwd: process.cwd(),
                environment: {
                    ...process.env,
                    NODE_ENV: "production",
                    NODE_PATH: undefined
                },
                maxBufferBytes: 16 * 1024 * 1024,
                timeoutMs: processTimeout
            }
        );
        const errorCode = (
            execution.error as (Error & { code?: string }) | undefined
        )?.code;
        const resultLine = execution.stdout
            ?.split("\n")
            .find(line => line.startsWith(probeResultPrefix));
        return {
            timedOut: errorCode === "ETIMEDOUT",
            error: execution.error,
            status: execution.status,
            signal: execution.signal,
            stderr: execution.stderr ?? "",
            result: resultLine
                ? (JSON.parse(
                      resultLine.slice(probeResultPrefix.length)
                  ) as unknown)
                : undefined
        };
    };
    const baseRequest = {
        specifier: resolvedSpecifier,
        parentUrl: options.parentUrl,
        testRunnerSpecifier: options.testRunnerSpecifier,
        package: options.package,
        functions: options.functions,
        modulePath: options.modulePath ?? "."
    };
    const discoveryExecution = await execute(
        { ...baseRequest, phase: "discover" },
        timeout
    );
    if (discoveryExecution.timedOut) {
        throw new Error(
            `Module recipe discovery exceeded the ${timeout}ms timeout`
        );
    }
    if (discoveryExecution.error) {
        throw new Error(
            `Module recipe discovery failed: ${discoveryExecution.error.message}`,
            { cause: discoveryExecution.error }
        );
    }
    if (discoveryExecution.status !== 0) {
        throw new Error(
            `Module recipe discovery exited with ${discoveryExecution.status ?? discoveryExecution.signal ?? "unknown status"}: ${discoveryExecution.stderr.trim()}`
        );
    }
    const discovery = discoveryExecution.result as DiscoveryResult | undefined;
    if (discovery?.kind !== "discovery") {
        throw new Error("Module recipe discovery emitted no structured result");
    }
    if (
        !Number.isSafeInteger(discovery.perSampleTimeoutMs) ||
        discovery.perSampleTimeoutMs < 1
    ) {
        throw new Error(
            `Test runner ${discovery.runnerId}@${discovery.runnerVersion} has an invalid per-sample timeout`
        );
    }
    const coordinateKeys = discovery.coordinates.map(
        coordinate => `${coordinate.functionName}\u0000${coordinate.label}`
    );
    if (new Set(coordinateKeys).size !== coordinateKeys.length) {
        throw new Error(
            `Test runner ${discovery.runnerId}@${discovery.runnerVersion} discovered duplicate recipe coordinates`
        );
    }
    const targetIdentities = new Map<string, string>();
    for (const coordinate of discovery.coordinates) {
        if (!/^[a-f\d]{64}$/u.test(coordinate.targetSourceSha256)) {
            throw new Error(
                `Probe discovered an invalid source identity for ${coordinate.functionName}`
            );
        }
        const existing = targetIdentities.get(coordinate.functionName);
        if (existing && existing !== coordinate.targetSourceSha256) {
            throw new Error(
                `Probe discovered conflicting source identities for ${coordinate.functionName}`
            );
        }
        targetIdentities.set(
            coordinate.functionName,
            coordinate.targetSourceSha256
        );
    }
    const attemptTimeout = Math.min(
        timeout,
        Math.max(discovery.perSampleTimeoutMs + 2_000, 2_500)
    );
    const samples: Record<string, string[]> = {};
    const coverage: Record<
        string,
        Record<string, readonly HotModuleCoverageClaim[]>
    > = {};
    const attempts: HotModuleProbeAttempt[] = [];
    const runAttempt = async (
        coordinate: DiscoveryResult["coordinates"][number]
    ): Promise<
        | AttemptResult
        | { kind: "timeout" }
        | { kind: "process-error"; error: string }
    > => {
        const execution = await execute(
            {
                ...baseRequest,
                runnerPackageTree: discovery.runnerPackageTree,
                runnerEntryPackagePath: discovery.runnerEntryPackagePath,
                runnerSourceGraph: discovery.runnerSourceGraph,
                phase: "attempt",
                functionName: coordinate.functionName,
                label: coordinate.label,
                targetSourceSha256: coordinate.targetSourceSha256
            },
            attemptTimeout
        );
        if (execution.timedOut) return { kind: "timeout" };
        if (execution.error) {
            return { kind: "process-error", error: execution.error.message };
        }
        if (execution.status !== 0) {
            return {
                kind: "process-error",
                error: `attempt process exited with ${execution.status ?? execution.signal ?? "unknown status"}: ${execution.stderr.trim()}`
            };
        }
        const result = execution.result as AttemptResult | undefined;
        return result?.kind === "attempt"
            ? result
            : {
                  kind: "process-error",
                  error: "attempt process emitted no structured result"
              };
    };
    const coordinateOutcomes = await mapWithConcurrency(
        discovery.coordinates,
        concurrency,
        async coordinate => {
            const first = await runAttempt(coordinate);
            if (first.kind === "timeout") {
                return {
                    coordinate,
                    attempt: {
                        functionName: coordinate.functionName,
                        label: coordinate.label,
                        status: "timed-out" as const,
                        error: `isolated recipe attempt exceeded the ${attemptTimeout}ms hard timeout`
                    }
                };
            }
            const second = await runAttempt(coordinate);
            if (second.kind === "timeout") {
                return {
                    coordinate,
                    attempt: {
                        functionName: coordinate.functionName,
                        label: coordinate.label,
                        status: "timed-out" as const,
                        error: `repeated isolated recipe attempt exceeded the ${attemptTimeout}ms hard timeout`
                    }
                };
            }
            if (
                first.kind === "process-error" ||
                second.kind === "process-error"
            ) {
                return {
                    coordinate,
                    attempt: {
                        functionName: coordinate.functionName,
                        label: coordinate.label,
                        status: "threw" as const,
                        error: [
                            first.kind === "process-error"
                                ? first.error
                                : undefined,
                            second.kind === "process-error"
                                ? second.error
                                : undefined
                        ]
                            .filter(Boolean)
                            .join("; ")
                    }
                };
            }
            const stable =
                first.status === second.status &&
                first.stage === second.stage &&
                first.error === second.error &&
                first.fingerprint === second.fingerprint;
            if (!stable) {
                return {
                    coordinate,
                    attempt: {
                        functionName: coordinate.functionName,
                        label: coordinate.label,
                        status: "nondeterministic" as const,
                        error: "fresh isolated attempts produced different lifecycle outcomes or semantic fingerprints"
                    }
                };
            }
            const attempt: HotModuleProbeAttempt = {
                functionName: coordinate.functionName,
                label: coordinate.label,
                status: first.status,
                ...(first.stage ? { stage: first.stage } : {}),
                ...(first.error ? { error: first.error } : {})
            };
            return {
                coordinate,
                attempt,
                accepted: first.status === "accepted"
            };
        }
    );
    for (const { coordinate, attempt, accepted } of coordinateOutcomes) {
        attempts.push(attempt);
        if (accepted) {
            (samples[coordinate.functionName] ??= []).push(coordinate.label);
            coverage[coordinate.functionName] ??= {};
            coverage[coordinate.functionName][coordinate.label] =
                coordinate.coverage;
        }
    }
    return {
        runnerId: discovery.runnerId,
        runnerVersion: discovery.runnerVersion,
        runnerSourceSha256,
        runnerPackageTree: discovery.runnerPackageTree,
        runnerEntryPackagePath: discovery.runnerEntryPackagePath,
        runnerSourceGraph: discovery.runnerSourceGraph,
        package: discovery.package,
        runtime: discovery.runtime,
        samples,
        targets: Object.fromEntries(
            [...targetIdentities].map(([name, sourceSha256]) => [
                name,
                { sourceSha256 }
            ])
        ),
        coverage,
        attempts
    };
};

/** Merge independently probed public entries without losing terminal attempts. */
export const mergeHotModuleProbeManifests = (
    manifests: readonly HotModuleProbeManifest[]
): HotModuleProbeManifest => {
    const first = manifests[0];
    if (!first) throw new Error("At least one probe manifest is required");
    const expectedIdentity = probeManifestSharedIdentity(first);
    const samples: Record<string, readonly string[]> = {};
    const targets: Record<string, { sourceSha256: string }> = {};
    const coverage: Record<
        string,
        Readonly<Record<string, readonly HotModuleCoverageClaim[]>>
    > = {};
    for (const manifest of manifests) {
        if (probeManifestSharedIdentity(manifest) !== expectedIdentity) {
            throw new Error(
                "Cannot merge probe manifests from different runner, package, or runtime identities"
            );
        }
        for (const name of Object.keys(manifest.samples)) {
            if (samples[name] || targets[name] || coverage[name]) {
                throw new Error(`Duplicate probed public target ${name}`);
            }
            samples[name] = manifest.samples[name];
            targets[name] = manifest.targets[name];
            coverage[name] = manifest.coverage[name] ?? {};
        }
    }
    return {
        ...first,
        samples,
        targets,
        coverage,
        attempts: manifests.flatMap(manifest => manifest.attempts)
    };
};
