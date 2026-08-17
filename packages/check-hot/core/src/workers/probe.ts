import {
    detectModuleRuntime,
    discoverModuleFunctions,
    resolveRunnerFunctionLocators,
    selectModuleFunctions
} from "../module-suite.js";
import { hotPublicTargetId } from "../public-target/index.js";
import { emitProtocolLine } from "../protocol.js";
import { analyzeHotModule } from "../analyzer.js";
import type {
    HotModuleCoverageClaim,
    HotModulePackage,
    HotModuleRuntime,
    HotModuleTestRunner
} from "../module-suite.js";
import type {
    HotPackageTreeIdentity,
    HotSourceFileIdentity
} from "../types.js";

interface ProbeRequest {
    specifier: string;
    parentUrl: string;
    testRunnerSpecifier: string;
    package: HotModulePackage;
    functions?: readonly string[];
    modulePath?: string;
    phase: "discover" | "attempt";
    functionName?: string;
    label?: string;
    targetSourceSha256?: string;
    runnerPackageTree?: HotPackageTreeIdentity;
    runnerEntryPackagePath?: string;
    runnerSourceGraph?: readonly HotSourceFileIdentity[];
}

interface ProbeCoordinate {
    functionName: string;
    label: string;
    targetSourceSha256: string;
    coverage: readonly HotModuleCoverageClaim[];
}

interface ProbeDiscoveryResult {
    kind: "discovery";
    runnerId: string;
    runnerVersion: string;
    package: HotModulePackage;
    runtime: HotModuleRuntime;
    perSampleTimeoutMs: number;
    runnerPackageTree: HotPackageTreeIdentity;
    runnerEntryPackagePath: string;
    runnerSourceGraph: readonly HotSourceFileIdentity[];
    coordinates: readonly ProbeCoordinate[];
}

interface ProbeAttemptResult {
    kind: "attempt";
    functionName: string;
    label: string;
    status: "accepted" | "threw" | "unsupported";
    fingerprint?: string;
    stage?:
        | "arguments"
        | "receiver"
        | "before"
        | "invoke"
        | "verify"
        | "after"
        | "fingerprint";
    error?: string;
}

const resultPrefix = "__CHECK_HOT_PROBE_RESULT__=";
const deno = (
    globalThis as {
        Deno?: {
            args: string[];
            stdout: { write(data: Uint8Array): Promise<number> };
        };
    }
).Deno;
const argument = deno ? deno.args.at(-1) : process.argv.at(-1);
if (!argument) throw new Error("Missing module probe request");
const request = JSON.parse(argument) as ProbeRequest;
if (!/^[a-zA-Z][a-zA-Z\d+.-]*:/u.test(request.specifier)) {
    throw new Error(
        "Probe worker requires the coordinator's runtime-conditioned absolute target URL"
    );
}
const runnerUrl = new URL(request.testRunnerSpecifier);
if (runnerUrl.protocol !== "file:") {
    throw new Error("Probe worker requires a local test-runner file URL");
}
const probeRuntime = detectModuleRuntime();
const ignoredRunnerFiles = request.parentUrl.startsWith("file:")
    ? [(await import("node:url")).fileURLToPath(request.parentUrl)]
    : [];
const runnerAnalysis = await analyzeHotModule({
    input: runnerUrl.href,
    runtime: probeRuntime.name,
    ignorePackageFiles: ignoredRunnerFiles
});
if (!runnerAnalysis.graphComplete) {
    throw new Error(
        `Test-runner source graph is incomplete: ${runnerAnalysis.diagnostics.join("; ")}`
    );
}
if (runnerAnalysis.externalBoundaries.length > 0) {
    const boundaries = runnerAnalysis.externalBoundaries
        .map(
            boundary =>
                `${boundary.importer} -> ${boundary.request} (${boundary.mode})`
        )
        .join("; ");
    throw new Error(
        `Test-runner has unauthenticated external runtime dependencies (${boundaries}); publish or select a self-contained bundled runner`
    );
}
const runnerPackageTree = runnerAnalysis.packageTree;
if (
    request.runnerPackageTree &&
    (request.runnerPackageTree.sourceSha256 !==
        runnerPackageTree.sourceSha256 ||
        request.runnerPackageTree.fileCount !== runnerPackageTree.fileCount ||
        request.runnerEntryPackagePath !== runnerAnalysis.entryPackagePath ||
        JSON.stringify(request.runnerSourceGraph) !==
            JSON.stringify(runnerAnalysis.sourceGraph))
) {
    throw new Error(
        "Test-runner package tree changed between recipe discovery and attempt"
    );
}
const namespace = (await import(request.specifier)) as Record<string, unknown>;
const runnerModule = (await import(request.testRunnerSpecifier)) as {
    default?: HotModuleTestRunner;
};
const runner = runnerModule.default;
if (
    !runner ||
    typeof runner.id !== "string" ||
    typeof runner.version !== "string" ||
    (runner.coveragePolicy !== "seed-only" &&
        runner.coveragePolicy !== "exact-obligation-claims") ||
    typeof runner.validate !== "function" ||
    typeof runner.listSamples !== "function" ||
    typeof runner.createSamples !== "function"
) {
    throw new Error(
        `${request.testRunnerSpecifier} has no valid default HotModuleTestRunner export`
    );
}
const modulePath = request.modulePath ?? ".";
const discoveredFunctions = new Map(
    [...discoverModuleFunctions(namespace).values()].map(candidate => [
        hotPublicTargetId({ modulePath, exportPath: [candidate.name] }),
        candidate
    ])
);
const baseContext = {
    namespace,
    functions: discoveredFunctions,
    package: request.package,
    runtime: probeRuntime
};
const incompatibilities = runner.validate(baseContext);
if (incompatibilities.length > 0) {
    throw new Error(
        `Test runner ${runner.id}@${runner.version} is incompatible:\n- ${incompatibilities.join("\n- ")}`
    );
}
const discoveredContext = resolveRunnerFunctionLocators(
    baseContext,
    runner,
    new Map([[modulePath, namespace]])
);
const selectedFunctions = request.functions
    ? selectModuleFunctions(discoveredContext.functions, request.functions)
    : undefined;
const selectedFunctionIds = selectedFunctions
    ? [...selectedFunctions.keys()]
    : undefined;
const context = selectedFunctions
    ? {
          ...discoveredContext,
          functions: selectedFunctions
      }
    : discoveredContext;

const unsupportedFingerprint = (message: string): never => {
    const error = new Error(message);
    error.name = "HotProbeUnsupported";
    throw error;
};

const canonicalValue = (root: unknown, rejectFunctions: boolean) => {
    const seen = new WeakMap<object, number>();
    let nextId = 0;
    let visited = 0;
    const visit = (value: unknown, depth: number): unknown => {
        if (depth > 12) {
            return unsupportedFingerprint(
                "semantic fingerprint exceeded maximum depth"
            );
        }
        if (++visited > 50_000) {
            return unsupportedFingerprint(
                "semantic fingerprint exceeded maximum object count"
            );
        }
        if (value === null) return ["null"];
        switch (typeof value) {
            case "undefined":
                return ["undefined"];
            case "boolean":
                return ["boolean", value];
            case "string":
                return ["string", value];
            case "bigint":
                return ["bigint", value.toString()];
            case "number":
                return [
                    "number",
                    Number.isNaN(value)
                        ? "NaN"
                        : Object.is(value, -0)
                          ? "-0"
                          : value === Number.POSITIVE_INFINITY
                            ? "+Infinity"
                            : value === Number.NEGATIVE_INFINITY
                              ? "-Infinity"
                              : value
                ];
            case "symbol":
                return [
                    "symbol",
                    Symbol.keyFor(value) === undefined ? "local" : "global",
                    Symbol.keyFor(value) ?? value.description ?? ""
                ];
            case "function":
                if (rejectFunctions) {
                    return unsupportedFingerprint(
                        "function results require sample.probeFingerprint to expose deterministic semantics"
                    );
                }
                break;
            default:
                break;
        }
        const object = value as object;
        const reference = seen.get(object);
        if (reference !== undefined) return ["reference", reference];
        const id = nextId++;
        seen.set(object, id);
        if (value instanceof WeakMap || value instanceof WeakSet) {
            return unsupportedFingerprint(
                "WeakMap and WeakSet values cannot be fingerprinted"
            );
        }
        if (value instanceof Date) {
            return [
                "date",
                id,
                Number.isNaN(value.getTime()) ? "invalid" : value.toISOString()
            ];
        }
        if (value instanceof RegExp) {
            return ["regexp", id, value.source, value.flags, value.lastIndex];
        }
        if (value instanceof Map) {
            return [
                "map",
                id,
                [...value].map(([key, item]) => [
                    visit(key, depth + 1),
                    visit(item, depth + 1)
                ])
            ];
        }
        if (value instanceof Set) {
            return ["set", id, [...value].map(item => visit(item, depth + 1))];
        }
        if (value instanceof ArrayBuffer) {
            return ["array-buffer", id, [...new Uint8Array(value)]];
        }
        if (ArrayBuffer.isView(value)) {
            return [
                Object.prototype.toString.call(value),
                id,
                [
                    ...new Uint8Array(
                        value.buffer,
                        value.byteOffset,
                        value.byteLength
                    )
                ]
            ];
        }
        if (value instanceof Error) {
            return [
                "error",
                id,
                value.name,
                value.message,
                visit(value.cause, depth + 1)
            ];
        }
        const functionSource =
            typeof value === "function"
                ? Function.prototype.toString.call(value)
                : undefined;
        const descriptors = Reflect.ownKeys(object)
            .map(key => {
                const descriptor = Object.getOwnPropertyDescriptor(object, key);
                if (!descriptor) {
                    return unsupportedFingerprint(
                        "an own property disappeared during fingerprinting"
                    );
                }
                const encodedKey =
                    typeof key === "symbol"
                        ? [
                              "symbol",
                              Symbol.keyFor(key) ?? key.description ?? ""
                          ]
                        : ["string", key];
                return [
                    encodedKey,
                    descriptor.enumerable,
                    descriptor.configurable,
                    "value" in descriptor
                        ? [
                              "data",
                              descriptor.writable,
                              visit(descriptor.value, depth + 1)
                          ]
                        : [
                              "accessor",
                              visit(descriptor.get, depth + 1),
                              visit(descriptor.set, depth + 1)
                          ]
                ];
            })
            .toSorted((left, right) =>
                JSON.stringify(left[0]).localeCompare(JSON.stringify(right[0]))
            );
        const prototype = Object.getPrototypeOf(object) as {
            constructor?: { name?: string };
        } | null;
        return [
            typeof value === "function" ? "function" : "object",
            id,
            prototype?.constructor?.name ?? null,
            functionSource,
            descriptors
        ];
    };
    return visit(root, 0);
};

const fingerprint = async (value: unknown, rejectFunctions = false) => {
    const bytes = new TextEncoder().encode(
        JSON.stringify(canonicalValue(value, rejectFunctions))
    );
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)]
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
};

const sourceFingerprint = async (value: CallableFunction) => {
    const bytes = new TextEncoder().encode(
        Function.prototype.toString.call(value)
    );
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)]
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
};

let result: ProbeDiscoveryResult | ProbeAttemptResult;
if (request.phase === "discover") {
    const listed = runner.listSamples(context);
    if (selectedFunctionIds) {
        const withoutRecipes = selectedFunctionIds.filter(
            name => !listed[name] || listed[name].length === 0
        );
        if (withoutRecipes.length > 0) {
            throw new Error(
                `Test runner ${runner.id}@${runner.version} provided no recipes for requested function(s): ${withoutRecipes.join(", ")}`
            );
        }
    }
    // A plugin may cache or deliberately expose a wider recipe catalog than
    // the filtered context. The core owns process selection, so never let an
    // adapter widen an explicit --function boundary.
    const selected = selectedFunctionIds
        ? Object.fromEntries(
              selectedFunctionIds.flatMap(name =>
                  listed[name] ? [[name, listed[name]]] : []
              )
          )
        : listed;
    const samples = runner.createSamples(context, selected);
    const coordinates: ProbeCoordinate[] = [];
    const targetSources = new Map(
        await Promise.all(
            Object.keys(selected).map(async functionName => {
                const target = context.functions.get(functionName);
                if (!target) {
                    throw new Error(
                        `Test runner listed recipes for unknown function ${functionName}`
                    );
                }
                return [
                    functionName,
                    await sourceFingerprint(target.fn)
                ] as const;
            })
        )
    );
    for (const [functionName, labels] of Object.entries(selected)) {
        const targetSourceSha256 = targetSources.get(functionName);
        if (!targetSourceSha256) {
            throw new Error(
                `Probe did not fingerprint selected function ${functionName}`
            );
        }
        if (new Set(labels).size !== labels.length) {
            throw new Error(
                `Test runner listed duplicate labels for ${functionName}`
            );
        }
        const available = new Map(
            (samples[functionName] ?? []).map(sample => [sample.label, sample])
        );
        for (const label of labels) {
            const sample = available.get(label);
            if (!sample) {
                throw new Error(
                    `Test runner listed ${functionName}:${label} but could not recreate it`
                );
            }
            coordinates.push({
                functionName,
                label,
                targetSourceSha256,
                coverage: sample.covers ?? []
            });
        }
    }
    result = {
        kind: "discovery",
        runnerId: runner.id,
        runnerVersion: runner.version,
        package: request.package,
        runtime: context.runtime,
        perSampleTimeoutMs: runner.perSampleTimeoutMs ?? 1_000,
        runnerPackageTree,
        runnerEntryPackagePath: runnerAnalysis.entryPackagePath,
        runnerSourceGraph: runnerAnalysis.sourceGraph,
        coordinates
    };
} else {
    const functionName = request.functionName;
    const label = request.label;
    if (!functionName || !label) {
        throw new Error("Probe attempt requires functionName and label");
    }
    const candidate = context.functions.get(functionName);
    if (!candidate)
        throw new Error(`Probe function ${functionName} disappeared`);
    const targetSourceSha256 = await sourceFingerprint(candidate.fn);
    if (
        !request.targetSourceSha256 ||
        targetSourceSha256 !== request.targetSourceSha256
    ) {
        throw new Error(
            `Probe function ${functionName} source identity changed between discovery and attempt`
        );
    }
    const recreated = runner.createSamples(context, {
        [functionName]: [label]
    });
    const sample = recreated[functionName]?.find(item => item.label === label);
    if (!sample)
        throw new Error(`Probe recipe ${functionName}:${label} disappeared`);
    let stage: ProbeAttemptResult["stage"] = "before";
    try {
        await sample.before?.(0, "warmup");
        stage = "arguments";
        const args = sample.args(0, "warmup");
        stage = "receiver";
        const receiver = sample.receiver?.(0, "warmup") ?? candidate.receiver;
        stage = "fingerprint";
        const before = await fingerprint({ args, receiver });
        let invocationError: unknown;
        let invocationStage: ProbeAttemptResult["stage"];
        let value: unknown;
        try {
            stage = "invoke";
            value = await Reflect.apply(candidate.fn, receiver, args);
            stage = "verify";
            await sample.verify?.(value, 0, "warmup");
        } catch (error) {
            invocationError = error;
            invocationStage = stage;
        }
        try {
            stage = "after";
            await sample.after?.(0, "warmup");
        } catch (error) {
            if (!invocationError) {
                invocationError = error;
                invocationStage = "after";
            }
        }
        if (invocationError) {
            throw Object.assign(
                invocationError instanceof Error
                    ? invocationError
                    : new Error(String(invocationError)),
                { probeStage: invocationStage }
            );
        }
        stage = "fingerprint";
        const after = await fingerprint({ args, receiver });
        const projectedResult = sample.probeFingerprint
            ? await sample.probeFingerprint({ args, receiver, result: value })
            : value;
        const resultFingerprint = await fingerprint(projectedResult, true);
        result = {
            kind: "attempt",
            functionName,
            label,
            status: "accepted",
            fingerprint: `${before}:${after}:${resultFingerprint}`
        };
    } catch (error) {
        const exception =
            error instanceof Error ? error : new Error(String(error));
        result = {
            kind: "attempt",
            functionName,
            label,
            status:
                exception.name === "HotProbeUnsupported"
                    ? "unsupported"
                    : "threw",
            stage:
                (
                    exception as Error & {
                        probeStage?: ProbeAttemptResult["stage"];
                    }
                ).probeStage ?? stage,
            error: exception.message
        };
    }
}

await emitProtocolLine(`${resultPrefix}${JSON.stringify(result)}\n`);
