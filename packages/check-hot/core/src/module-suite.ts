import type {
    HotAstEvidence,
    HotCheckObligation,
    HotMutationExclusion,
    HotMutationFamily,
    HotMutationObservation,
    HotPackageTreeIdentity,
    HotPreflightOutcome,
    HotPhase,
    HotPublicFunctionLocator,
    HotRuntimeName,
    HotSourceFileIdentity,
    HotSuite,
    HotSuiteOptions,
    HotTarget
} from "./types.js";
import {
    hotPublicTargetId,
    resolveHotPublicFunction
} from "./public-target/index.js";
import {
    applyHotMutation,
    canApplyHotMutation,
    hotMutationVariantLabel,
    hotMutationVariantLabels
} from "./mutations.js";
import { createHotPackageTreeIdentity } from "./source-identity.js";
import {
    assertHotSelectedSample,
    finalizeHotSampleSelection
} from "./sample-selection/index.js";
import {
    runtimeResolutionFailure,
    sourceIntegrityFailure
} from "./problems/source-integrity/check.js";

/** Arguments constructed afresh for one module-export invocation. */
export interface HotModuleSample {
    /** Stable scenario suffix shown in reports. */
    label: string;
    /** Construct a receiver for this invocation, or omit it for the discovered owner. */
    receiver?: (iteration: number, phase: HotPhase) => unknown;
    /** Construct fresh arguments so mutation does not leak between iterations. */
    args: (iteration: number, phase: HotPhase) => readonly unknown[];
    /** Exact AST obligations deliberately exercised by this sample. */
    covers?: readonly HotModuleCoverageClaim[];
    /** Optional per-invocation setup kept inside the selected runtime worker. */
    before?: (iteration: number, phase: HotPhase) => void | Promise<void>;
    /** Verify the semantic result so optimization success cannot hide bad output. */
    verify?: (
        result: unknown,
        iteration: number,
        phase: HotPhase
    ) => void | Promise<void>;
    /**
     * Verify the result against the actual receiver and arguments after core
     * mutation. Only this args-aware contract may close an AST obligation.
     */
    verifyMutation?: (
        context: HotModuleMutationVerificationContext
    ) => void | Promise<void>;
    /**
     * Restrict core-generated mutations to this recipe's documented input
     * domain. Returning a reason excludes that variant without counting it as
     * evidence; accepted variants still require `verifyMutation`.
     */
    acceptMutation?: (
        context: HotModuleMutationInputContext
    ) => true | string | Promise<true | string>;
    /**
     * Project opaque results such as closures onto deterministic semantic data
     * for isolated probe comparison. Omit it for structurally inspectable data.
     */
    probeFingerprint?: (
        context: HotModuleProbeFingerprintContext
    ) => unknown | Promise<unknown>;
    /**
     * Select the value whose representations prove an exact manual claim.
     * This is required when the evidence is not carried by a public argument,
     * for example a return-representation obligation.
     */
    observe?: (
        context: HotModuleObservationContext
    ) => unknown | Promise<unknown>;
    /** Optional per-invocation cleanup. */
    after?: (iteration: number, phase: HotPhase) => void | Promise<void>;
    /** Recipe-specific warmup iteration budget. */
    warmupIterations?: number;
    /** Recipe-specific guarded-stress iteration budget. */
    stressIterations?: number;
}

/** Actual invocation values exposed to an exact mutation verifier. */
export interface HotModuleMutationVerificationContext {
    /** Exact obligation being exercised. */
    obligationId: string;
    /** Mutation family selected by the analyzer proof. */
    mutationFamily: HotMutationFamily;
    /** Stable core or adapter variant ID. */
    variant: string;
    /** Receiver used by the measured invocation. */
    receiver: unknown;
    /** Arguments after the core applied the requested mutation. */
    args: readonly unknown[];
    /** Public result returned for those exact inputs. */
    result: unknown;
    /** Recipe iteration used to construct non-mutated sample state. */
    iteration: number;
    /** Stable warmup or guarded-stress lifecycle phase. */
    phase: HotPhase;
}

/** Actual input offered to a recipe before a core-generated mutation runs. */
export type HotModuleMutationInputContext = Omit<
    HotModuleMutationVerificationContext,
    "result"
>;

/** Values available to a recipe-owned semantic fingerprint projection. */
export interface HotModuleProbeFingerprintContext {
    /** Receiver after the invocation and cleanup lifecycle. */
    receiver: unknown;
    /** Arguments after the invocation and cleanup lifecycle. */
    args: readonly unknown[];
    /** Verified public result. */
    result: unknown;
}

/** Context used to select a value for one exact adapter-owned claim. */
export interface HotModuleObservationContext {
    /** Exact obligation currently being proven. */
    obligationId: string;
    /** Mutation family that determines the representation oracle. */
    mutationFamily: HotMutationFamily;
    /** Fresh arguments used by the invocation. */
    args: readonly unknown[];
    /** Semantic result returned by the public function. */
    result: unknown;
    /** Recipe iteration within its phase. */
    iteration: number;
    /** Stable warmup or deliberately varying stress phase. */
    phase: HotPhase;
}

/** Exact manual coverage claim; family-only claims are intentionally invalid. */
export interface HotModuleCoverageClaim {
    /** Stable obligation ID embedded by the analyzer. */
    obligationId: string;
    /** Mutation family used to reject stale or mismatched generated configs. */
    mutationFamily: HotMutationFamily;
}

/** Name and version of the module under test. */
export interface HotModulePackage {
    /** Package name from its nearest named manifest. */
    name?: string;
    /** Exact package version from its nearest named manifest. */
    version?: string;
}

/** Runtime/engine fingerprint visible to an external test-runner plugin. */
export interface HotModuleRuntime {
    /** Active JavaScript runtime. */
    name: HotRuntimeName;
    /** Exact runtime version. */
    version: string;
    /** Active engine family. */
    engine: "v8" | "jsc";
    /** Exact engine version when the runtime exposes it. */
    engineVersion?: string;
}

/** One discovered ESM or flattened CommonJS function export. */
export interface HotModuleFunction {
    /** Public export/property name. */
    name: string;
    /** Exact function guarded by optimization checks. */
    fn: CallableFunction;
    /** Namespace or CommonJS object that owns the function. */
    receiver: unknown;
}

/** Context passed to a separately installed module test runner. */
export interface HotModuleTestRunnerContext {
    /** Imported module namespace. */
    namespace: Record<string, unknown>;
    /** Public functions discovered without library-specific knowledge. */
    functions: ReadonlyMap<string, HotModuleFunction>;
    /** Declared package identity. */
    package: HotModulePackage;
    /** Current runtime and engine versions. */
    runtime: HotModuleRuntime;
}

/** Versioned selection emitted by an isolated module probe. */
export interface HotModuleProbeManifest {
    /** Test-runner plugin ID. */
    runnerId: string;
    /** Exact test-runner plugin version. */
    runnerVersion: string;
    /** SHA-256 of the exact test-runner entry source used by the probe. */
    runnerSourceSha256: string;
    /** Package-relative runner entry selected during the isolated probe. */
    runnerEntryPackagePath: string;
    /** Complete local source/asset graph imported by the runner. */
    runnerSourceGraph: readonly HotSourceFileIdentity[];
    /** Resolver-sensitive tree of the runner package accepted by the probe. */
    runnerPackageTree: HotPackageTreeIdentity;
    /** Package identity used while selecting samples. */
    package: HotModulePackage;
    /** Node/V8 version used by the disposable probe. */
    runtime: HotModuleRuntime;
    /** Successful recipe labels grouped by public export. */
    samples: Readonly<Record<string, readonly string[]>>;
    /** Exact runtime function source identity grouped by public export. */
    targets: Readonly<Record<string, { sourceSha256: string }>>;
    /** Exact obligations proven by each accepted recipe label. */
    coverage: Readonly<
        Record<
            string,
            Readonly<Record<string, readonly HotModuleCoverageClaim[]>>
        >
    >;
    /** Every attempted recipe, including failures that were previously omitted. */
    attempts: readonly HotModuleProbeAttempt[];
}

/** Terminal outcome of one recipe in the disposable probe process. */
export interface HotModuleProbeAttempt {
    /** Public function selected by the recipe resolver. */
    functionName: string;
    /** Stable recipe label. */
    label: string;
    /** Probe outcome; only accepted recipes are replayed as hot scenarios. */
    status:
        | "accepted"
        | "threw"
        | "timed-out"
        | "nondeterministic"
        | "unsupported";
    /** Lifecycle stage that rejected the recipe, when known. */
    stage?:
        | "arguments"
        | "receiver"
        | "before"
        | "invoke"
        | "verify"
        | "after"
        | "fingerprint";
    /** Sanitized exception or timeout detail. */
    error?: string;
}

/** Plugin contract implemented outside the engine orchestration core. */
export interface HotModuleTestRunner {
    /** Stable plugin ID. */
    id: string;
    /** Exact plugin implementation version. */
    version: string;
    /** Whether this adapter only supplies seeds or may emit exact-ID claims. */
    coveragePolicy: "seed-only" | "exact-obligation-claims";
    /** Locate additional public functions hidden behind exported objects. */
    discover?(
        context: HotModuleTestRunnerContext
    ): readonly HotPublicFunctionLocator[];
    /**
     * Return incompatibility explanations for package/runtime versions.
     * An empty array authorizes sampling on this exact environment.
     */
    validate(context: HotModuleTestRunnerContext): readonly string[];
    /**
     * Enumerate recipes without invoking target code. The core uses this list
     * to run every recipe attempt in its own hard-timeout process.
     */
    listSamples(
        context: HotModuleTestRunnerContext
    ): Readonly<Record<string, readonly string[]>>;
    /** Preferred target-invocation timeout, excluding process startup. */
    perSampleTimeoutMs?: number;
    /** Recreate deterministic samples selected by a previous probe. */
    createSamples(
        context: HotModuleTestRunnerContext,
        selected: Readonly<Record<string, readonly string[]>>
    ): Readonly<Record<string, readonly HotModuleSample[]>>;
}

/** Low-code adapter options for a module's public function exports. */
export interface HotModuleEntryOptions {
    /** Package export key: `.` for the root or a concrete `./subpath`. */
    modulePath: string;
    /** Load this public module only inside a fresh runtime worker. */
    load: (resolvedUrl?: string) => Promise<Record<string, unknown>>;
    /** Resolve this public module through the active runtime. */
    resolve?: () => string | Promise<string>;
}

export interface HotModuleSuiteOptions {
    /** Human-readable suite name. */
    name: string;
    /** Node loader needed by a suite dependency such as a TypeScript test-runner. */
    workerLoader?: "tsx";
    /** Load the module namespace in each fresh worker process. */
    load?: (resolvedUrl?: string) => Promise<Record<string, unknown>>;
    /** Resolve the public specifier from the generated suite for version checks. */
    resolve?: () => string | Promise<string>;
    /** Multiple public package entries composed by the generic core. */
    modules?: readonly HotModuleEntryOptions[];
    /** Exact public callables selected by static provenance. */
    publicTargets?: readonly HotPublicFunctionLocator[];
    /** Restrict discovery to these export names. */
    include?: readonly string[];
    /** Remove these export names from discovery. */
    exclude?: readonly string[];
    /** Explicit, deterministic samples grouped by export name. */
    samples?: Readonly<Record<string, readonly HotModuleSample[]>>;
    /** Optional ecosystem runner or worker-only lazy loader supplied externally. */
    testRunner?: HotModuleTestRunner | (() => Promise<HotModuleTestRunner>);
    /** Versioned recipe selection produced by `init --probe`. */
    probeManifest?: HotModuleProbeManifest;
    /** Identity of the imported package, used for compatibility checks. */
    package?: HotModulePackage;
    /** Environment variables applied before loading the module. */
    environment?: Readonly<Record<string, string>>;
    /** AST evidence embedded by the analyzer. */
    evidence?: readonly HotAstEvidence[];
    /** Complete AST obligation plan embedded by the analyzer. */
    obligations?: readonly HotCheckObligation[];
    /** Static graph provenance and source-loader contract from the analyzer. */
    analysis?: HotSuite["analysis"];
    /** Default runtime and stress matrix. */
    options?: HotSuiteOptions;
}

interface LoadedModuleState {
    functions: ReadonlyMap<string, HotModuleFunction>;
    samples: ReadonlyMap<
        string,
        { exported: HotModuleFunction; sample: HotModuleSample }
    >;
    blockedScenarios: ReadonlySet<string>;
    preflightByScenario: ReadonlyMap<string, readonly HotPreflightOutcome[]>;
    selectedSampleByScenario: ReadonlyMap<string, string>;
}

interface MutationPreflightScenario {
    scenarioId: string;
    sampleIds: readonly string[];
    family: HotMutationFamily;
    parameterIndex: number;
    parameterPath: readonly (string | number)[];
    obligationId: string;
    evidenceId: string;
    mutation?: {
        family: HotMutationFamily;
        parameterIndex: number;
        parameterPath: readonly (string | number)[];
    };
}

/** Discover direct ESM and enumerable CommonJS-default function exports. */
export const discoverModuleFunctions = (namespace: Record<string, unknown>) => {
    const functions = new Map<string, HotModuleFunction>();
    const addFunctions = (
        owner: Record<string, unknown>,
        receiver: unknown
    ) => {
        for (const name of Object.keys(owner)) {
            const descriptor = Object.getOwnPropertyDescriptor(owner, name);
            const value =
                descriptor && "value" in descriptor
                    ? descriptor.value
                    : undefined;
            if (
                !functions.has(name) &&
                typeof value === "function" &&
                !/^class\s/u.test(Function.prototype.toString.call(value))
            ) {
                functions.set(name, { name, fn: value, receiver });
            }
        }
    };
    addFunctions(namespace, namespace);

    const defaultDescriptor = Object.getOwnPropertyDescriptor(
        namespace,
        "default"
    );
    const defaultExport =
        defaultDescriptor && "value" in defaultDescriptor
            ? defaultDescriptor.value
            : undefined;
    if (
        (typeof defaultExport === "object" ||
            typeof defaultExport === "function") &&
        defaultExport !== null
    ) {
        addFunctions(
            defaultExport as unknown as Record<string, unknown>,
            defaultExport
        );
    }
    return functions;
};

/** Detect exact runtime and engine versions without library-specific policy. */
export const detectModuleRuntime = (): HotModuleRuntime => {
    const globals = globalThis as {
        Bun?: { version?: string };
        Deno?: { version?: { deno?: string; v8?: string } };
        process?: { versions?: Record<string, string | undefined> };
    };
    if (globals.Deno?.version) {
        return {
            name: "deno",
            version: globals.Deno.version.deno ?? "unknown",
            engine: "v8",
            engineVersion: globals.Deno.version.v8
        };
    }
    if (globals.Bun) {
        return {
            name: "bun",
            version: globals.Bun.version ?? "unknown",
            engine: "jsc",
            engineVersion:
                globals.process?.versions?.webkit ??
                globals.process?.versions?.javascriptcore
        };
    }
    return {
        name: "node",
        version: globals.process?.versions?.node ?? "unknown",
        engine: "v8",
        engineVersion: globals.process?.versions?.v8
    };
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

const assertRuntimeTargetIdentities = async (
    functions: ReadonlyMap<string, HotModuleFunction>,
    manifest: HotModuleProbeManifest
) => {
    for (const [name, expected] of Object.entries(manifest.targets)) {
        const target = functions.get(name);
        if (!target) {
            throw runtimeResolutionFailure(
                `Probe target ${name} disappeared from the runtime module surface`
            );
        }
        // oxlint-disable-next-line no-await-in-loop -- Every selected runtime callable must be authenticated before recipes are recreated.
        const actual = await sourceFingerprint(target.fn);
        if (actual !== expected.sourceSha256) {
            throw sourceIntegrityFailure(
                `Probe target ${name} source identity changed (${actual} != ${expected.sourceSha256}); regenerate the suite`
            );
        }
    }
};

/** Resolve adapter-provided public locators without trusting callable values. */
export const resolveRunnerFunctionLocators = (
    context: HotModuleTestRunnerContext,
    runner: HotModuleTestRunner | undefined,
    namespaces: ReadonlyMap<string, Record<string, unknown>> = new Map([
        [".", context.namespace]
    ])
): HotModuleTestRunnerContext => {
    const additional = runner?.discover
        ? [...namespaces.values()].flatMap(
              namespace => runner.discover?.({ ...context, namespace }) ?? []
          )
        : [];
    if (additional.length === 0) return context;
    const functions = new Map(context.functions);
    for (const locator of additional) {
        const targetId = hotPublicTargetId(locator);
        const namespace = namespaces.get(locator.modulePath);
        const candidate = namespace
            ? resolveHotPublicFunction(namespace, locator)
            : undefined;
        if (!candidate) {
            throw new Error(
                `Test runner ${runner?.id ?? "unknown"} located missing public function ${targetId}`
            );
        }
        const existing = functions.get(targetId);
        if (
            existing &&
            (existing.fn !== candidate.fn ||
                existing.receiver !== candidate.receiver)
        ) {
            throw new Error(
                `Test runner ${runner?.id ?? "unknown"} located ambiguous public function ${targetId}`
            );
        }
        functions.set(targetId, {
            ...candidate,
            name: locator.exportPath.join(".")
        });
    }
    return { ...context, functions };
};

/** Resolve human display names or exact target IDs to one unambiguous subset. */
export const selectModuleFunctions = (
    functions: ReadonlyMap<string, HotModuleFunction>,
    selectors: readonly string[]
) => {
    const selected = new Map<string, HotModuleFunction>();
    for (const selector of selectors) {
        const matches = [...functions].filter(
            ([targetId, candidate]) =>
                targetId === selector || candidate.name === selector
        );
        if (matches.length === 0) {
            throw new Error(
                `Requested probe function is absent from the runtime module surface: ${selector}`
            );
        }
        if (matches.length > 1) {
            throw new Error(
                `Requested probe function ${selector} is ambiguous; use one structured target ID: ${matches.map(([targetId]) => targetId).join(", ")}`
            );
        }
        const match = matches[0];
        if (match) selected.set(match[0], match[1]);
    }
    return selected;
};

const validateProbeManifest = (
    runner: HotModuleTestRunner,
    manifest: HotModuleProbeManifest,
    packageValue: HotModulePackage
) => {
    if (!/^[a-f\d]{64}$/u.test(manifest.runnerSourceSha256)) {
        throw new Error(
            "Probe manifest must identify the exact test-runner source with SHA-256"
        );
    }
    if (
        !manifest.runnerEntryPackagePath ||
        manifest.runnerEntryPackagePath.startsWith("/") ||
        manifest.runnerEntryPackagePath === ".." ||
        manifest.runnerEntryPackagePath.startsWith("../") ||
        manifest.runnerEntryPackagePath.includes("\\") ||
        manifest.runnerSourceGraph.length === 0 ||
        new Set(manifest.runnerSourceGraph.map(source => source.relativeFile))
            .size !== manifest.runnerSourceGraph.length ||
        manifest.runnerSourceGraph.some(
            source =>
                !source.relativeFile ||
                source.relativeFile.startsWith("/") ||
                source.relativeFile === ".." ||
                source.relativeFile.startsWith("../") ||
                source.relativeFile.includes("\\") ||
                !/^[a-f\d]{64}$/u.test(source.sourceSha256)
        ) ||
        !manifest.runnerSourceGraph.some(
            source =>
                source.relativeFile === manifest.runnerEntryPackagePath &&
                source.sourceSha256 === manifest.runnerSourceSha256
        )
    ) {
        throw new Error(
            "Probe manifest has an invalid test-runner source-graph identity"
        );
    }
    const runnerPackageTree = manifest.runnerPackageTree;
    if (
        !runnerPackageTree ||
        !/^[a-f\d]{64}$/u.test(runnerPackageTree.sourceSha256) ||
        !Number.isSafeInteger(runnerPackageTree.fileCount) ||
        runnerPackageTree.fileCount < 0 ||
        new Set(runnerPackageTree.ignoredRelativeFiles).size !==
            runnerPackageTree.ignoredRelativeFiles.length ||
        runnerPackageTree.ignoredRelativeFiles.some(
            file =>
                !file ||
                file.startsWith("/") ||
                file === ".." ||
                file.startsWith("../") ||
                file.includes("\\")
        )
    ) {
        throw new Error(
            `Probe manifest has an invalid test-runner package-tree identity`
        );
    }
    if (
        manifest.runnerId !== runner.id ||
        manifest.runnerVersion !== runner.version
    ) {
        throw new Error(
            `Probe used test runner ${manifest.runnerId}@${manifest.runnerVersion}, but suite loaded ${runner.id}@${runner.version}; regenerate the suite`
        );
    }
    if (
        manifest.package.name !== packageValue.name ||
        manifest.package.version !== packageValue.version
    ) {
        throw new Error(
            `Probe package ${manifest.package.name ?? "unknown"}@${manifest.package.version ?? "unknown"} does not match ${packageValue.name ?? "unknown"}@${packageValue.version ?? "unknown"}; regenerate the suite`
        );
    }
    if (
        !manifest.samples ||
        !manifest.targets ||
        !manifest.coverage ||
        !Array.isArray(manifest.attempts)
    ) {
        throw new Error(
            "Probe manifest must contain samples, exact target identities, coverage, and terminal attempts"
        );
    }
    for (const [name, target] of Object.entries(manifest.targets)) {
        if (!name || !/^[a-f\d]{64}$/u.test(target.sourceSha256)) {
            throw new Error(
                "Probe manifest has an invalid runtime target source identity"
            );
        }
    }
    const attempts = new Map<string, HotModuleProbeAttempt>();
    for (const attempt of manifest.attempts) {
        const key = `${attempt.functionName}\u0000${attempt.label}`;
        if (attempts.has(key)) {
            throw new Error(
                `Probe manifest duplicates terminal attempt ${attempt.functionName}:${attempt.label}`
            );
        }
        attempts.set(key, attempt);
    }
    for (const [functionName, labels] of Object.entries(manifest.samples)) {
        if (!manifest.targets[functionName]) {
            throw new Error(
                `Probe manifest omits runtime target identity for ${functionName}`
            );
        }
        if (new Set(labels).size !== labels.length) {
            throw new Error(
                `Probe manifest duplicates selected sample labels for ${functionName}`
            );
        }
        for (const label of labels) {
            const attempt = attempts.get(`${functionName}\u0000${label}`);
            if (attempt?.status !== "accepted") {
                throw new Error(
                    `Probe manifest selects ${functionName}:${label} without one accepted terminal attempt`
                );
            }
            if (!manifest.coverage[functionName]?.[label]) {
                throw new Error(
                    `Probe manifest omits exact coverage for accepted sample ${functionName}:${label}`
                );
            }
        }
    }
    for (const functionName of Object.keys(manifest.targets)) {
        if (!manifest.samples[functionName]) {
            throw new Error(
                `Probe manifest target identity refers to unselected function ${functionName}`
            );
        }
    }
    for (const attempt of manifest.attempts) {
        const selected = manifest.samples[attempt.functionName]?.includes(
            attempt.label
        );
        if (attempt.status === "accepted" && !selected) {
            throw new Error(
                `Probe manifest omits accepted sample ${attempt.functionName}:${attempt.label}`
            );
        }
        if (attempt.status !== "accepted" && selected) {
            throw new Error(
                `Probe manifest selects rejected sample ${attempt.functionName}:${attempt.label}`
            );
        }
    }
    for (const [functionName, labels] of Object.entries(manifest.coverage)) {
        for (const [label, claims] of Object.entries(labels)) {
            if (!manifest.samples[functionName]?.includes(label)) {
                throw new Error(
                    `Probe manifest coverage refers to unaccepted sample ${functionName}:${label}`
                );
            }
            const claimKeys = claims.map(
                claim => `${claim.obligationId}\u0000${claim.mutationFamily}`
            );
            if (new Set(claimKeys).size !== claimKeys.length) {
                throw new Error(
                    `Probe manifest duplicates exact coverage claims for ${functionName}:${label}`
                );
            }
            if (runner.coveragePolicy === "seed-only" && claims.length > 0) {
                throw new Error(
                    `Seed-only test runner ${runner.id} emitted coverage for ${functionName}:${label}`
                );
            }
        }
    }
};

const assertHotArtifactSha256 = async (
    specifier: string | URL,
    expectedSha256: string,
    label: string
) => {
    const url = specifier instanceof URL ? specifier : new URL(specifier);
    if (url.protocol !== "file:") {
        throw new Error(`${label} must resolve to a local file URL`);
    }
    const [{ readFile }, { createHash }, { fileURLToPath }] = await Promise.all(
        [import("node:fs/promises"), import("node:crypto"), import("node:url")]
    );
    const actualSha256 = createHash("sha256")
        .update(await readFile(fileURLToPath(url)))
        .digest("hex");
    if (actualSha256 !== expectedSha256) {
        throw sourceIntegrityFailure(
            `${label} changed after analysis/probe (${actualSha256} != ${expectedSha256}); regenerate the suite`
        );
    }
};

/** Import a test runner only after authenticating its probed source artifact. */
export const loadHotTestRunner = async (
    specifier: string | URL,
    expectedSha256: string,
    expectedPackageTree: HotPackageTreeIdentity,
    expectedEntryPackagePath: string,
    expectedSourceGraph: readonly HotSourceFileIdentity[]
) => {
    await assertHotArtifactSha256(
        specifier,
        expectedSha256,
        "Test-runner source"
    );
    const url = specifier instanceof URL ? specifier : new URL(specifier);
    const [{ dirname, resolve }, { fileURLToPath }] = await Promise.all([
        import("node:path"),
        import("node:url")
    ]);
    const loadedPackage = await detectLoadedPackage(url.href);
    const root =
        (await verifyLoadedEntryPath(
            expectedEntryPackagePath,
            url.href,
            loadedPackage
        )) ?? dirname(fileURLToPath(url));
    const actualPackageTree = await createHotPackageTreeIdentity(
        root,
        expectedPackageTree.ignoredRelativeFiles.map(file =>
            resolve(root, file)
        )
    );
    if (
        actualPackageTree.sourceSha256 !== expectedPackageTree.sourceSha256 ||
        actualPackageTree.fileCount !== expectedPackageTree.fileCount
    ) {
        throw sourceIntegrityFailure(
            `Test-runner package tree changed after probe; regenerate the suite`
        );
    }
    await assertHotSourceGraph(root, expectedSourceGraph);
    const loaded = (await import(url.href)) as {
        default?: HotModuleTestRunner;
    };
    if (!loaded.default) {
        throw new Error(
            `${url.href} has no default HotModuleTestRunner export`
        );
    }
    return loaded.default;
};

export const detectLoadedPackage = async (
    resolvedUrl: string
): Promise<HotModulePackage & { root?: string }> => {
    if (!resolvedUrl.startsWith("file:")) return {};
    const [{ readFile }, path, url] = await Promise.all([
        import("node:fs/promises"),
        import("node:path"),
        import("node:url")
    ]);
    let directory = path.dirname(url.fileURLToPath(resolvedUrl));
    while (true) {
        try {
            const manifest = JSON.parse(
                // oxlint-disable-next-line no-await-in-loop -- Ancestor lookup stops at the nearest readable named manifest.
                await readFile(path.join(directory, "package.json"), "utf8")
            ) as { name?: unknown; version?: unknown };
            if (typeof manifest.name === "string") {
                return {
                    name: manifest.name,
                    version:
                        typeof manifest.version === "string"
                            ? manifest.version
                            : undefined,
                    root: directory
                };
            }
        } catch {
            // A missing or foreign manifest is expected while walking ancestors.
        }
        const parent = path.dirname(directory);
        if (parent === directory) return {};
        directory = parent;
    }
};

/** Rebase analyzer evidence onto the package installation loaded by a suite. */
export const rebaseHotEvidence = async (
    evidence: readonly HotAstEvidence[],
    resolvedModuleUrl: string
): Promise<readonly HotAstEvidence[]> => {
    const detected = await detectLoadedPackage(resolvedModuleUrl);
    if (!detected.root) return evidence;
    return rebaseHotEvidenceToRoot(evidence, detected.root);
};

const rebaseHotEvidenceToRoot = async (
    evidence: readonly HotAstEvidence[],
    root: string
): Promise<readonly HotAstEvidence[]> => {
    const path = await import("node:path");
    return evidence.map(item => {
        const file = path.resolve(root, item.span.relativeFile);
        const fragment = path.relative(root, file);
        if (fragment === ".." || fragment.startsWith(`..${path.sep}`)) {
            throw new Error(
                `Hot evidence ${item.id} escapes loaded package root through ${item.span.relativeFile}`
            );
        }
        return {
            ...item,
            span: { ...item.span, file },
            ownerSpan: { ...item.ownerSpan, file }
        };
    });
};

const verifyLoadedPackage = (
    expected: HotModulePackage,
    actual: HotModulePackage
) => {
    if (
        (expected.name && expected.name !== actual.name) ||
        (expected.version && expected.version !== actual.version)
    ) {
        throw runtimeResolutionFailure(
            `Resolved target package ${actual.name ?? "unknown"}@${actual.version ?? "unknown"} does not match generated suite ${expected.name ?? "unknown"}@${expected.version ?? "unknown"}; regenerate the suite`
        );
    }
};

const verifyLoadedEntryPath = async (
    expectedPackagePath: string | undefined,
    resolvedUrl: string,
    loadedPackage: HotModulePackage & { root?: string }
) => {
    if (!expectedPackagePath) return loadedPackage.root;
    if (!resolvedUrl.startsWith("file:")) {
        throw runtimeResolutionFailure(
            `Resolved target is not a local file for analyzed entry ${expectedPackagePath}`
        );
    }
    const [path, { fileURLToPath }] = await Promise.all([
        import("node:path"),
        import("node:url")
    ]);
    const resolvedFile = fileURLToPath(resolvedUrl);
    const pathParts = expectedPackagePath.split("/");
    const inferredRoot = pathParts.reduce(
        root => path.dirname(root),
        resolvedFile
    );
    const root = loadedPackage.root ?? inferredRoot;
    const actualPackagePath = path
        .relative(root, resolvedFile)
        .split(path.sep)
        .join("/");
    if (actualPackagePath !== expectedPackagePath) {
        throw runtimeResolutionFailure(
            `Runtime resolved package entry ${actualPackagePath}, but the analyzer selected ${expectedPackagePath}; resolver parity is not proven`
        );
    }
    return root;
};

const assertHotSourceGraph = async (
    root: string,
    sources: NonNullable<HotSuite["analysis"]>["sourceGraph"]
) => {
    if (!sources) return;
    const [{ readFile }, { createHash }, path] = await Promise.all([
        import("node:fs/promises"),
        import("node:crypto"),
        import("node:path")
    ]);
    /* oxlint-disable no-await-in-loop -- Authenticate the complete graph with bounded file descriptors before importing target code. */
    for (const source of sources) {
        const file = path.resolve(root, source.relativeFile);
        const fragment = path.relative(root, file);
        if (fragment === ".." || fragment.startsWith(`..${path.sep}`)) {
            throw new Error(
                `Analyzed source graph escapes its package root through ${source.relativeFile}`
            );
        }
        const actual = createHash("sha256")
            .update(await readFile(file))
            .digest("hex");
        if (actual !== source.sourceSha256) {
            throw sourceIntegrityFailure(
                `Analyzed source graph changed at ${source.relativeFile} (${actual} != ${source.sourceSha256}); regenerate the suite`
            );
        }
    }
    /* oxlint-enable no-await-in-loop */
};

const assertHotPackageTree = async (
    root: string,
    expected: NonNullable<HotSuite["analysis"]>["packageTree"]
) => {
    if (!expected) return;
    const path = await import("node:path");
    const actual = await createHotPackageTreeIdentity(
        root,
        expected.ignoredRelativeFiles.map(file => path.resolve(root, file))
    );
    if (
        actual.sourceSha256 !== expected.sourceSha256 ||
        actual.fileCount !== expected.fileCount
    ) {
        throw sourceIntegrityFailure(
            `Analyzed package tree changed (${actual.fileCount} files/${actual.sourceSha256} != ${expected.fileCount} files/${expected.sourceSha256}); regenerate the suite`
        );
    }
};

const selectDeclaredSamples = (options: HotModuleSuiteOptions) => {
    const included = options.include ? new Set(options.include) : undefined;
    const excluded = new Set(options.exclude ?? []);
    const names = new Set([
        ...Object.keys(options.probeManifest?.samples ?? {}),
        ...Object.keys(options.samples ?? {})
    ]);
    const selected = new Map<string, readonly string[]>();

    for (const name of [...names].toSorted()) {
        if (included && !included.has(name)) continue;
        if (excluded.has(name)) continue;
        const explicit = options.samples?.[name];
        const labels = explicit
            ? explicit.map(sample => sample.label)
            : (options.probeManifest?.samples[name] ?? []);
        if (new Set(labels).size !== labels.length) {
            throw new Error(
                `Module function ${name} has duplicate sample labels`
            );
        }
        if (labels.length > 0) selected.set(name, labels);
    }
    return selected;
};

const declaredCoverage = (
    options: HotModuleSuiteOptions,
    name: string,
    label: string
) =>
    options.samples?.[name]?.find(sample => sample.label === label)?.covers ??
    options.probeManifest?.coverage?.[name]?.[label] ??
    [];

const valueAtParameterPath = (
    args: readonly unknown[],
    parameterIndex: number,
    parameterPath: readonly (string | number)[]
) => {
    let value = args[parameterIndex];
    for (const key of parameterPath) {
        if (typeof value !== "object" || value === null) return;
        value = (value as Record<string | number, unknown>)[key];
    }
    return value;
};

const provesRepresentationTransition = (
    family: HotMutationFamily,
    observations: readonly HotMutationObservation[]
) => {
    const stress = observations.filter(
        observation => observation.variant !== "adapter-baseline"
    );
    const baselineRepresentation = observations.find(
        observation => observation.variant === "adapter-baseline"
    )?.representation;
    switch (family) {
        case "dynamic-code":
            // Exact Inspector coverage proves that the eval/new Function site
            // ran; the output verifier proves its public semantics.
            return stress.some(
                observation => observation.representation === "site-executed"
            );
        case "object-shape":
        case "callback-identity":
        case "prototype-chain":
        case "property-key":
        case "numeric-representation":
        case "array-elements":
        case "allocation-pressure":
        case "control-flow":
        case "return-representation":
            return (
                baselineRepresentation !== undefined &&
                stress.some(
                    observation =>
                        observation.representation !== baselineRepresentation
                )
            );
    }
};

const serializeInvocation = (receiver: unknown, args: readonly unknown[]) => {
    const seen = new Map<object, number>();
    const visit = (value: unknown): string => {
        if (value === null) return "null";
        if (typeof value === "number") {
            if (Number.isNaN(value)) return "number:NaN";
            if (Object.is(value, -0)) return "number:-0";
            return `number:${value}`;
        }
        if (typeof value === "bigint") return `bigint:${value}`;
        if (typeof value === "symbol") {
            return `symbol:${Symbol.keyFor(value) ?? value.description ?? ""}`;
        }
        if (typeof value === "function") {
            return `function:${Function.prototype.toString.call(value)}`;
        }
        if (typeof value !== "object") {
            return `${typeof value}:${String(value)}`;
        }
        const known = seen.get(value);
        if (known !== undefined) return `reference:${known}`;
        const reference = seen.size;
        seen.set(value, reference);
        const tag = Object.prototype.toString.call(value);
        const prototype = Object.getPrototypeOf(value) as {
            constructor?: { name?: unknown };
        } | null;
        const prototypeName =
            prototype && typeof prototype.constructor?.name === "string"
                ? prototype.constructor.name
                : "null";
        const properties = Reflect.ownKeys(value).map(key => {
            const descriptor = Object.getOwnPropertyDescriptor(value, key);
            const label =
                typeof key === "symbol"
                    ? `symbol:${Symbol.keyFor(key) ?? key.description ?? ""}`
                    : `string:${key}`;
            if (!descriptor) return `${label}:missing`;
            if ("value" in descriptor) {
                return `${label}:${descriptor.enumerable ? "e" : "n"}:${descriptor.writable ? "w" : "r"}:${visit(descriptor.value)}`;
            }
            return `${label}:accessor:${descriptor.get ? Function.prototype.toString.call(descriptor.get) : ""}:${descriptor.set ? Function.prototype.toString.call(descriptor.set) : ""}`;
        });
        return `object:${reference}:${tag}:${prototypeName}:{${properties.join(",")}}`;
    };
    return `receiver=${visit(receiver)};args=${visit([...args])}`;
};

const invocationFingerprint = async (
    receiver: unknown,
    args: readonly unknown[]
) => {
    const { createHash } = await import("node:crypto");
    return createHash("sha256")
        .update(serializeInvocation(receiver, args))
        .digest("hex");
};

/**
 * Build a declarative suite without importing the module under test.
 * Loading, discovery, validation, and sample construction occur only in the
 * fresh runtime worker through the returned suite's `setup` callback.
 */
export const createModuleSuite = (
    options: HotModuleSuiteOptions
): HotSuite<LoadedModuleState> => {
    if (options.modules && (options.load || options.resolve)) {
        throw new Error(
            "Module suite must use either load/resolve or modules, not both"
        );
    }
    const moduleEntries: readonly HotModuleEntryOptions[] =
        options.modules ??
        (options.load
            ? [
                  {
                      modulePath: ".",
                      load: options.load,
                      resolve: options.resolve
                  }
              ]
            : []);
    if (moduleEntries.length === 0) {
        throw new Error("Module suite requires load() or at least one module");
    }
    const modulePaths = moduleEntries.map(entry => entry.modulePath);
    if (
        modulePaths.some(path => path.length === 0) ||
        new Set(modulePaths).size !== modulePaths.length
    ) {
        throw new Error("Module suite public module paths must be unique");
    }
    const publicTargetIds = (options.publicTargets ?? []).map(target =>
        hotPublicTargetId(target)
    );
    if (new Set(publicTargetIds).size !== publicTargetIds.length) {
        throw new Error("Module suite public targets must be unique");
    }
    for (const target of options.publicTargets ?? []) {
        if (!modulePaths.includes(target.modulePath)) {
            throw new Error(
                `Public target ${hotPublicTargetId(target)} references undeclared module ${target.modulePath}`
            );
        }
    }
    if (options.testRunner || options.probeManifest) {
        if (!options.testRunner || !options.probeManifest) {
            throw new Error(
                "testRunner and probeManifest must be provided together"
            );
        }
        if (typeof options.testRunner !== "function") {
            validateProbeManifest(
                options.testRunner,
                options.probeManifest,
                options.package ?? {}
            );
        }
    }

    const declaredSamples = selectDeclaredSamples(options);
    const coveredObligations = new Set<string>();
    const mutationPreflights: MutationPreflightScenario[] = [];
    const scenarios: HotSuite<LoadedModuleState>["scenarios"][number][] = [];
    for (const [name, labels] of declaredSamples) {
        const target: HotTarget<LoadedModuleState> = {
            id: name,
            annotation: false,
            resolve: state => state.functions.get(name)?.fn as CallableFunction
        };
        const addScenario = (
            label: string,
            scenarioId: string,
            obligations: readonly string[],
            mutation?: {
                family: HotMutationFamily;
                parameterIndex: number;
                parameterPath: readonly (string | number)[];
            },
            candidateLabels: readonly string[] = [label]
        ) => {
            for (const obligation of obligations) {
                coveredObligations.add(obligation);
            }
            const explicitCandidates = (options.samples?.[name] ?? []).filter(
                sample => candidateLabels.includes(sample.label)
            );
            const maximumIterationOverride = (
                field: "warmupIterations" | "stressIterations"
            ) => {
                const values = explicitCandidates
                    .map(sample => sample[field])
                    .filter((value): value is number => value !== undefined);
                return values.length > 0 ? Math.max(...values) : undefined;
            };
            scenarios.push({
                id: scenarioId,
                targets: [target],
                obligations,
                warmupIterations: maximumIterationOverride("warmupIterations"),
                stressIterations: maximumIterationOverride("stressIterations"),
                async run({ state, iteration, phase, invoke }) {
                    const sampleId =
                        state.selectedSampleByScenario.get(scenarioId) ??
                        `${name}:${label}`;
                    const invocation = state.samples.get(sampleId);
                    if (!invocation) {
                        throw new Error(
                            `Module sample ${sampleId} was not resolved during worker setup`
                        );
                    }
                    const declaredVariantLabels = mutation
                        ? hotMutationVariantLabels(mutation.family)
                        : [];
                    const scenarioPreflight =
                        obligations.length === 1
                            ? (
                                  state.preflightByScenario.get(scenarioId) ??
                                  []
                              ).find(
                                  outcome =>
                                      outcome.obligationId === obligations[0]
                              )
                            : undefined;
                    const acceptedStressObservations =
                        scenarioPreflight?.mutationPlan?.observations.filter(
                            observation =>
                                observation.variant !== "adapter-baseline"
                        ) ?? [];
                    const variantCount = mutation
                        ? !state.blockedScenarios.has(scenarioId) &&
                          acceptedStressObservations.length > 0
                            ? acceptedStressObservations.length
                            : declaredVariantLabels.length
                        : 6;
                    const replayIteration =
                        phase === "warmup" ? 0 : iteration % variantCount;
                    const mutationIteration =
                        mutation &&
                        phase === "stress" &&
                        !state.blockedScenarios.has(scenarioId) &&
                        acceptedStressObservations.length > 0
                            ? declaredVariantLabels.indexOf(
                                  acceptedStressObservations[replayIteration]
                                      .variant
                              )
                            : replayIteration;
                    if (mutation && mutationIteration < 0) {
                        throw new Error(
                            `Measurement replay contains undeclared ${mutation.family} variant`
                        );
                    }
                    const sampleIteration = mutation
                        ? 0
                        : obligations.length > 0
                          ? replayIteration
                          : iteration;
                    await invocation.sample.before?.(sampleIteration, phase);
                    try {
                        const seedArgs = invocation.sample.args(
                            sampleIteration,
                            phase
                        );
                        const args =
                            mutation &&
                            phase === "stress" &&
                            !state.blockedScenarios.has(scenarioId)
                                ? applyHotMutation(
                                      seedArgs,
                                      mutation.parameterIndex,
                                      mutation.family,
                                      mutationIteration,
                                      mutation.parameterPath
                                  )
                                : seedArgs;
                        const receiver =
                            invocation.sample.receiver?.(
                                sampleIteration,
                                phase
                            ) ?? invocation.exported.receiver;
                        if (
                            obligations.length > 0 &&
                            !state.blockedScenarios.has(scenarioId)
                        ) {
                            const fingerprint = await invocationFingerprint(
                                receiver,
                                args
                            );
                            for (const obligationId of obligations) {
                                const outcome = (
                                    state.preflightByScenario.get(scenarioId) ??
                                    []
                                ).find(
                                    candidate =>
                                        candidate.obligationId === obligationId
                                );
                                const phaseObservations =
                                    outcome?.mutationPlan?.observations.filter(
                                        observation =>
                                            phase === "warmup"
                                                ? observation.variant ===
                                                  "adapter-baseline"
                                                : observation.variant !==
                                                  "adapter-baseline"
                                    ) ?? [];
                                const expected =
                                    phase === "warmup"
                                        ? phaseObservations[0]
                                        : phaseObservations[replayIteration];
                                if (
                                    !expected ||
                                    expected.replayFingerprint !== fingerprint
                                ) {
                                    throw new Error(
                                        `Measurement replay for ${obligationId} diverged from disposable preflight during ${phase} variant ${replayIteration}`
                                    );
                                }
                            }
                        }
                        const result = await invoke(target, receiver, args);
                        const mutationVerificationActive =
                            phase === "stress" &&
                            obligations.length > 0 &&
                            !state.blockedScenarios.has(scenarioId) &&
                            invocation.sample.verifyMutation !== undefined;
                        if (!mutationVerificationActive) {
                            await invocation.sample.verify?.(
                                result,
                                sampleIteration,
                                phase
                            );
                        }
                        if (
                            obligations.length > 0 &&
                            !state.blockedScenarios.has(scenarioId)
                        ) {
                            for (const obligationId of obligations) {
                                const outcome = (
                                    state.preflightByScenario.get(scenarioId) ??
                                    []
                                ).find(
                                    candidate =>
                                        candidate.obligationId === obligationId
                                );
                                const observations =
                                    outcome?.mutationPlan?.observations.filter(
                                        observation =>
                                            phase === "warmup"
                                                ? observation.variant ===
                                                  "adapter-baseline"
                                                : observation.variant !==
                                                  "adapter-baseline"
                                    ) ?? [];
                                const observation =
                                    phase === "warmup"
                                        ? observations[0]
                                        : observations[replayIteration];
                                if (!outcome || !observation) continue;
                                // oxlint-disable-next-line no-await-in-loop -- Exact obligation verifiers run in declared order within one sample lifecycle.
                                await invocation.sample.verifyMutation?.({
                                    obligationId,
                                    mutationFamily: outcome.mutationFamily,
                                    variant: observation.variant,
                                    receiver,
                                    args,
                                    result,
                                    iteration: sampleIteration,
                                    phase
                                });
                            }
                        }
                    } finally {
                        await invocation.sample.after?.(sampleIteration, phase);
                    }
                }
            });
        };

        for (const label of labels) {
            const claims = declaredCoverage(options, name, label);
            const claimedObligations: string[] = [];
            for (const claim of claims) {
                const obligation = options.obligations?.find(
                    candidate => candidate.id === claim.obligationId
                );
                if (!obligation) {
                    throw new Error(
                        `Sample ${name}:${label} claims unknown obligation ${claim.obligationId}`
                    );
                }
                if (
                    obligation.exportName !== name ||
                    obligation.mutationFamily !== claim.mutationFamily
                ) {
                    throw new Error(
                        `Sample ${name}:${label} claim ${claim.obligationId} does not match export ${name} and family ${claim.mutationFamily}`
                    );
                }
                claimedObligations.push(obligation.id);
            }
            addScenario(label, `${name}:${label}`, claimedObligations);
            for (const obligationId of claimedObligations) {
                const obligation = options.obligations?.find(
                    candidate => candidate.id === obligationId
                ) as HotCheckObligation;
                mutationPreflights.push({
                    scenarioId: `${name}:${label}`,
                    sampleIds: [`${name}:${label}`],
                    family: obligation.mutationFamily,
                    parameterIndex: obligation.parameterIndex ?? -1,
                    parameterPath: obligation.parameterPath ?? [],
                    obligationId,
                    evidenceId: obligation.evidenceId
                });
            }
        }

        for (const obligation of options.obligations ?? []) {
            if (
                coveredObligations.has(obligation.id) ||
                obligation.blockedReason ||
                obligation.exportName !== name ||
                obligation.parameterIndex === undefined ||
                !canApplyHotMutation(obligation.mutationFamily)
            ) {
                continue;
            }
            const seedLabel = labels[0];
            const scenarioId = `${name}:auto:${obligation.id}`;
            addScenario(
                seedLabel,
                scenarioId,
                [obligation.id],
                {
                    family: obligation.mutationFamily,
                    parameterIndex: obligation.parameterIndex,
                    parameterPath: obligation.parameterPath ?? []
                },
                labels
            );
            mutationPreflights.push({
                scenarioId,
                sampleIds: labels.map(label => `${name}:${label}`),
                family: obligation.mutationFamily,
                parameterIndex: obligation.parameterIndex,
                parameterPath: obligation.parameterPath ?? [],
                obligationId: obligation.id,
                evidenceId: obligation.evidenceId,
                mutation: {
                    family: obligation.mutationFamily,
                    parameterIndex: obligation.parameterIndex,
                    parameterPath: obligation.parameterPath ?? []
                }
            });
        }
    }

    if (scenarios.length === 0) {
        if ((options.obligations?.length ?? 0) === 0) {
            throw new Error(
                `Module suite ${options.name} found no runnable function samples or AST obligations; add explicit samples or a compatible external test runner`
            );
        }
        scenarios.push({
            id: "ast-coverage-ledger",
            targets: [],
            run() {}
        });
    }
    const obligations: HotCheckObligation[] = [];
    for (const obligation of options.obligations ?? []) {
        if (coveredObligations.has(obligation.id) || obligation.blockedReason) {
            obligations.push(obligation);
            continue;
        }
        const copy = { ...obligation };
        copy.blockedReason = obligation.exportName
            ? obligation.parameterIndex === undefined
                ? `AST provenance did not connect ${obligation.mutationFamily} to a mutable public argument of ${obligation.exportName}`
                : !canApplyHotMutation(obligation.mutationFamily)
                  ? `${obligation.mutationFamily} requires an adapter-owned semantic scenario`
                  : `No accepted semantic seed is available for ${obligation.exportName} argument ${obligation.parameterIndex}`
            : "The AST candidate is not reachable as a direct callable package export";
        obligations.push(copy);
    }

    let preparedEvidence = options.evidence;
    const resolvedModuleUrls = new Map<string, string>();
    let preparedRuntime: string | undefined;
    let preparation: Promise<void> | undefined;
    const prepareModule = async (runtime: HotModuleRuntime) => {
        const runtimeIdentity = `${runtime.name}@${runtime.version}/${runtime.engine}@${runtime.engineVersion ?? "unknown"}`;
        if (preparedRuntime && preparedRuntime !== runtimeIdentity) {
            throw new Error(
                `Module suite was already prepared for ${preparedRuntime}, not ${runtimeIdentity}`
            );
        }
        preparation ??= (async () => {
            let preparedSourceRoot: string | undefined;
            /* oxlint-disable no-await-in-loop -- Every public entry is independently authenticated before any target import. */
            for (const moduleEntry of moduleEntries) {
                const analyzedEntry =
                    options.analysis?.publicEntries?.find(
                        entry => entry.modulePath === moduleEntry.modulePath
                    ) ??
                    (moduleEntry.modulePath === "." &&
                    (options.analysis?.entryPackagePath ||
                        options.analysis?.entrySourceSha256)
                        ? {
                              modulePath: ".",
                              entryPackagePath:
                                  options.analysis.entryPackagePath,
                              entrySourceSha256:
                                  options.analysis.entrySourceSha256
                          }
                        : undefined);
                if (!moduleEntry.resolve) {
                    if (analyzedEntry?.entrySourceSha256) {
                        throw new Error(
                            `Analyzer-generated module ${moduleEntry.modulePath} requires resolve() to authenticate its entry artifact`
                        );
                    }
                    continue;
                }
                const resolvedModuleUrl = await moduleEntry.resolve();
                resolvedModuleUrls.set(
                    moduleEntry.modulePath,
                    resolvedModuleUrl
                );
                if (analyzedEntry?.entrySourceSha256) {
                    await assertHotArtifactSha256(
                        resolvedModuleUrl,
                        analyzedEntry.entrySourceSha256,
                        moduleEntry.modulePath === "."
                            ? "Analyzed module entry"
                            : `Analyzed module entry ${moduleEntry.modulePath}`
                    );
                }
                const loadedPackage =
                    await detectLoadedPackage(resolvedModuleUrl);
                verifyLoadedPackage(options.package ?? {}, loadedPackage);
                const sourceRoot = await verifyLoadedEntryPath(
                    analyzedEntry?.entryPackagePath,
                    resolvedModuleUrl,
                    loadedPackage
                );
                if (sourceRoot) {
                    if (
                        preparedSourceRoot !== undefined &&
                        preparedSourceRoot !== sourceRoot
                    ) {
                        throw new Error(
                            `Public module ${moduleEntry.modulePath} resolved outside the authenticated target package`
                        );
                    }
                    preparedSourceRoot = sourceRoot;
                }
            }
            /* oxlint-enable no-await-in-loop */
            if (preparedSourceRoot) {
                await assertHotPackageTree(
                    preparedSourceRoot,
                    options.analysis?.packageTree
                );
                await assertHotSourceGraph(
                    preparedSourceRoot,
                    options.analysis?.sourceGraph
                );
                preparedEvidence = await rebaseHotEvidenceToRoot(
                    options.evidence ?? [],
                    preparedSourceRoot
                );
            } else if (moduleEntries.length === 1) {
                const resolvedModuleUrl = resolvedModuleUrls.get(
                    moduleEntries[0].modulePath
                );
                if (resolvedModuleUrl) {
                    preparedEvidence = await rebaseHotEvidence(
                        options.evidence ?? [],
                        resolvedModuleUrl
                    );
                }
            } else if (options.analysis?.entrySourceSha256) {
                throw new Error(
                    "Analyzer-generated multi-entry suite could not authenticate a common package root"
                );
            }
            preparedRuntime = runtimeIdentity;
        })();
        await preparation;
    };

    const loadModuleState = async (
        runtime: HotModuleRuntime
    ): Promise<LoadedModuleState> => {
        if (
            options.probeManifest &&
            (options.probeManifest.runtime.name !== runtime.name ||
                options.probeManifest.runtime.version !== runtime.version ||
                options.probeManifest.runtime.engine !== runtime.engine ||
                options.probeManifest.runtime.engineVersion !==
                    runtime.engineVersion)
        ) {
            throw new Error(
                `Probe manifest was accepted on ${options.probeManifest.runtime.name}@${options.probeManifest.runtime.version}/${options.probeManifest.runtime.engine}@${options.probeManifest.runtime.engineVersion ?? "unknown"}, but measurement uses ${runtime.name}@${runtime.version}/${runtime.engine}@${runtime.engineVersion ?? "unknown"}; probe this exact runtime first`
            );
        }
        await prepareModule(runtime);
        const namespaces = new Map<string, Record<string, unknown>>();
        for (const moduleEntry of moduleEntries) {
            // oxlint-disable-next-line no-await-in-loop -- Public modules load in stable order after all artifacts are authenticated.
            const namespace = await moduleEntry.load(
                resolvedModuleUrls.get(moduleEntry.modulePath)
            );
            namespaces.set(moduleEntry.modulePath, namespace);
        }
        const namespace =
            namespaces.get(".") ??
            (namespaces.values().next().value as Record<string, unknown>);
        const discoveredFunctions = new Map<string, HotModuleFunction>();
        for (const [modulePath, moduleNamespace] of namespaces) {
            for (const candidate of discoverModuleFunctions(
                moduleNamespace
            ).values()) {
                const targetId = hotPublicTargetId({
                    modulePath,
                    exportPath: [candidate.name]
                });
                const existing = discoveredFunctions.get(targetId);
                if (existing && existing.fn !== candidate.fn) {
                    throw new Error(
                        `Public target ID collision for ${targetId}`
                    );
                }
                discoveredFunctions.set(targetId, candidate);
            }
        }
        for (const target of options.publicTargets ?? []) {
            const moduleNamespace = namespaces.get(target.modulePath);
            const candidate = moduleNamespace
                ? resolveHotPublicFunction(moduleNamespace, target)
                : undefined;
            if (candidate) {
                discoveredFunctions.set(hotPublicTargetId(target), candidate);
            }
        }
        const packageValue = options.package ?? {};
        const baseContext: HotModuleTestRunnerContext = {
            namespace,
            functions: discoveredFunctions,
            package: packageValue,
            runtime
        };
        let context = baseContext;
        let runnerSamples: Readonly<
            Record<string, readonly HotModuleSample[]>
        > = {};
        if (options.testRunner && options.probeManifest) {
            const testRunner =
                typeof options.testRunner === "function"
                    ? await options.testRunner()
                    : options.testRunner;
            validateProbeManifest(
                testRunner,
                options.probeManifest,
                options.package ?? {}
            );
            const incompatibilities = testRunner.validate(baseContext);
            if (incompatibilities.length > 0) {
                throw new Error(
                    `Test runner ${testRunner.id} is incompatible:\n- ${incompatibilities.join("\n- ")}`
                );
            }
            context = resolveRunnerFunctionLocators(
                baseContext,
                testRunner,
                namespaces
            );
            await assertRuntimeTargetIdentities(
                context.functions,
                options.probeManifest
            );
            runnerSamples = testRunner.createSamples(
                context,
                options.probeManifest.samples
            );
        }

        const samples = new Map<
            string,
            { exported: HotModuleFunction; sample: HotModuleSample }
        >();
        for (const [name, labels] of declaredSamples) {
            const exported = context.functions.get(name);
            if (!exported) {
                throw new Error(
                    `Module function ${name} declared samples but was not exported or discovered`
                );
            }
            const available =
                options.samples?.[name] ?? runnerSamples[name] ?? [];
            for (const label of labels) {
                const matches = available.filter(
                    sample => sample.label === label
                );
                if (matches.length !== 1) {
                    throw new Error(
                        `Module sample ${name}:${label} resolved ${matches.length} times; expected exactly once`
                    );
                }
                samples.set(`${name}:${label}`, {
                    exported,
                    sample: matches[0]
                });
            }
        }
        return {
            functions: context.functions,
            samples,
            blockedScenarios: new Set(),
            preflightByScenario: new Map(),
            selectedSampleByScenario: new Map()
        };
    };

    return {
        name: options.name,
        workerLoader: options.workerLoader,
        environment: options.environment,
        analysis: options.analysis,
        adapter:
            options.testRunner && options.probeManifest
                ? {
                      id: options.probeManifest.runnerId,
                      version: options.probeManifest.runnerVersion,
                      sourceSha256: options.probeManifest.runnerSourceSha256,
                      packageTreeSha256:
                          options.probeManifest.runnerPackageTree.sourceSha256,
                      probeRuntime: options.probeManifest.runtime.name,
                      probeRuntimeVersion: options.probeManifest.runtime.version
                  }
                : undefined,
        get evidence() {
            return preparedEvidence;
        },
        obligations,
        prepare: ({ runtime }) => prepareModule(runtime),
        preflight:
            mutationPreflights.length === 0
                ? undefined
                : async ({
                      runtime,
                      scenarios: selectedScenarios,
                      observeMutation,
                      measureEvidence
                  }) => {
                      const state = await loadModuleState({
                          name: runtime.name,
                          version: runtime.version,
                          engine: runtime.engine,
                          engineVersion: runtime.engineVersion
                      });
                      const selected = new Set(selectedScenarios);
                      const outcomes: HotPreflightOutcome[] = [];
                      /* oxlint-disable no-await-in-loop -- Every mutation reuses one disposable semantic lifecycle in deterministic order. */
                      for (const mutation of mutationPreflights) {
                          if (!selected.has(mutation.scenarioId)) continue;
                          const candidateOutcomes: HotPreflightOutcome[] = [];
                          for (const sampleId of mutation.sampleIds) {
                              const invocation = state.samples.get(sampleId);
                              if (!invocation) {
                                  candidateOutcomes.push({
                                      obligationId: mutation.obligationId,
                                      evidenceId: mutation.evidenceId,
                                      mutationFamily: mutation.family,
                                      scenarioId: mutation.scenarioId,
                                      sampleId,
                                      status: "blocked",
                                      semanticVerification: "invocation-only",
                                      reason: `Automatic ${mutation.family} preflight could not resolve ${sampleId}`
                                  });
                                  continue;
                              }
                              let reason: string | undefined;
                              const observations: HotMutationObservation[] = [];
                              const excludedVariants: HotMutationExclusion[] =
                                  [];
                              try {
                                  if (!observeMutation) {
                                      throw new Error(
                                          "the runtime exposes no representation oracle"
                                      );
                                  }
                                  if (
                                      !invocation.sample.observe &&
                                      mutation.parameterIndex < 0
                                  ) {
                                      throw new Error(
                                          `adapter-owned ${mutation.family} has no public argument path; add sample.observe`
                                      );
                                  }

                                  let baselineValue: unknown;
                                  await invocation.sample.before?.(0, "warmup");
                                  try {
                                      const baselineArgs =
                                          invocation.sample.args(0, "warmup");
                                      const baselineReceiver =
                                          invocation.sample.receiver?.(
                                              0,
                                              "warmup"
                                          ) ?? invocation.exported.receiver;
                                      const baselineFingerprint =
                                          await invocationFingerprint(
                                              baselineReceiver,
                                              baselineArgs
                                          );
                                      const baselineMeasurement =
                                          measureEvidence
                                              ? await measureEvidence(
                                                    mutation.evidenceId,
                                                    invocation.exported.fn,
                                                    () =>
                                                        Reflect.apply(
                                                            invocation.exported
                                                                .fn,
                                                            baselineReceiver,
                                                            baselineArgs
                                                        )
                                                )
                                              : {
                                                    value: await Reflect.apply(
                                                        invocation.exported.fn,
                                                        baselineReceiver,
                                                        baselineArgs
                                                    ),
                                                    siteHitCount: 0
                                                };
                                      const baselineResult =
                                          baselineMeasurement.value;
                                      await invocation.sample.verify?.(
                                          baselineResult,
                                          0,
                                          "warmup"
                                      );
                                      await invocation.sample.verifyMutation?.({
                                          obligationId: mutation.obligationId,
                                          mutationFamily: mutation.family,
                                          variant: "adapter-baseline",
                                          receiver: baselineReceiver,
                                          args: baselineArgs,
                                          result: baselineResult,
                                          iteration: 0,
                                          phase: "warmup"
                                      });
                                      baselineValue = invocation.sample.observe
                                          ? await invocation.sample.observe({
                                                obligationId:
                                                    mutation.obligationId,
                                                mutationFamily: mutation.family,
                                                args: baselineArgs,
                                                result: baselineResult,
                                                iteration: 0,
                                                phase: "warmup"
                                            })
                                          : valueAtParameterPath(
                                                baselineArgs,
                                                mutation.parameterIndex,
                                                mutation.parameterPath
                                            );
                                      observations.push(
                                          Object.assign(
                                              observeMutation(
                                                  mutation.family,
                                                  baselineValue,
                                                  baselineValue,
                                                  "adapter-baseline"
                                              ),
                                              {
                                                  siteHitCount:
                                                      baselineMeasurement.siteHitCount,
                                                  replayFingerprint:
                                                      baselineFingerprint
                                              }
                                          )
                                      );
                                  } finally {
                                      await invocation.sample.after?.(
                                          0,
                                          "warmup"
                                      );
                                  }

                                  const variantCount = mutation.mutation
                                      ? hotMutationVariantLabels(
                                            mutation.family
                                        ).length
                                      : 6;
                                  for (
                                      let iteration = 0;
                                      iteration < variantCount;
                                      iteration++
                                  ) {
                                      const sampleIteration = mutation.mutation
                                          ? 0
                                          : iteration;
                                      await invocation.sample.before?.(
                                          sampleIteration,
                                          "stress"
                                      );
                                      try {
                                          const seedArgs =
                                              invocation.sample.args(
                                                  sampleIteration,
                                                  "stress"
                                              );
                                          const args = mutation.mutation
                                              ? applyHotMutation(
                                                    seedArgs,
                                                    mutation.mutation
                                                        .parameterIndex,
                                                    mutation.mutation.family,
                                                    iteration,
                                                    mutation.mutation
                                                        .parameterPath
                                                )
                                              : seedArgs;
                                          const variant = mutation.mutation
                                              ? hotMutationVariantLabel(
                                                    mutation.family,
                                                    iteration
                                                )
                                              : `adapter-variant-${iteration}`;
                                          const receiver =
                                              invocation.sample.receiver?.(
                                                  sampleIteration,
                                                  "stress"
                                              ) ?? invocation.exported.receiver;
                                          if (
                                              mutation.mutation &&
                                              invocation.sample.acceptMutation
                                          ) {
                                              const acceptance =
                                                  await invocation.sample.acceptMutation(
                                                      {
                                                          obligationId:
                                                              mutation.obligationId,
                                                          mutationFamily:
                                                              mutation.family,
                                                          variant,
                                                          receiver,
                                                          args,
                                                          iteration:
                                                              sampleIteration,
                                                          phase: "stress"
                                                      }
                                                  );
                                              if (acceptance !== true) {
                                                  if (
                                                      typeof acceptance !==
                                                      "string"
                                                  ) {
                                                      throw new TypeError(
                                                          "acceptMutation must return true or a reason string"
                                                      );
                                                  }
                                                  const exclusionReason =
                                                      acceptance.trim();
                                                  if (
                                                      exclusionReason.length ===
                                                          0 ||
                                                      exclusionReason.length >
                                                          500
                                                  ) {
                                                      throw new TypeError(
                                                          "acceptMutation exclusion reason must contain 1 to 500 characters"
                                                      );
                                                  }
                                                  excludedVariants.push({
                                                      variant,
                                                      reason: exclusionReason
                                                  });
                                                  continue;
                                              }
                                          }
                                          const replayFingerprint =
                                              await invocationFingerprint(
                                                  receiver,
                                                  args
                                              );
                                          const measurement = measureEvidence
                                              ? await measureEvidence(
                                                    mutation.evidenceId,
                                                    invocation.exported.fn,
                                                    () =>
                                                        Reflect.apply(
                                                            invocation.exported
                                                                .fn,
                                                            receiver,
                                                            args
                                                        )
                                                )
                                              : {
                                                    value: await Reflect.apply(
                                                        invocation.exported.fn,
                                                        receiver,
                                                        args
                                                    ),
                                                    siteHitCount: 0
                                                };
                                          const result = measurement.value;
                                          await invocation.sample.verifyMutation?.(
                                              {
                                                  obligationId:
                                                      mutation.obligationId,
                                                  mutationFamily:
                                                      mutation.family,
                                                  variant,
                                                  receiver,
                                                  args,
                                                  result,
                                                  iteration: sampleIteration,
                                                  phase: "stress"
                                              }
                                          );
                                          const value = invocation.sample
                                              .observe
                                              ? await invocation.sample.observe(
                                                    {
                                                        obligationId:
                                                            mutation.obligationId,
                                                        mutationFamily:
                                                            mutation.family,
                                                        args,
                                                        result,
                                                        iteration:
                                                            sampleIteration,
                                                        phase: "stress"
                                                    }
                                                )
                                              : valueAtParameterPath(
                                                    args,
                                                    mutation.parameterIndex,
                                                    mutation.parameterPath
                                                );
                                          observations.push(
                                              Object.assign(
                                                  observeMutation(
                                                      mutation.family,
                                                      baselineValue,
                                                      value,
                                                      variant
                                                  ),
                                                  {
                                                      siteHitCount:
                                                          measurement.siteHitCount,
                                                      replayFingerprint
                                                  }
                                              )
                                          );
                                      } finally {
                                          await invocation.sample.after?.(
                                              sampleIteration,
                                              "stress"
                                          );
                                      }
                                  }
                              } catch (error) {
                                  reason = `Automatic ${mutation.family} preflight was blocked: ${error instanceof Error ? error.message : String(error)}`;
                              }
                              if (
                                  !reason &&
                                  !invocation.sample.verifyMutation
                              ) {
                                  reason = `Semantic ${mutation.family} preflight lacks an args-aware verifier; add sample.verifyMutation to close the obligation`;
                              }
                              if (!reason && observations.length === 0) {
                                  reason = `Semantic ${mutation.family} preflight has no runtime representation observation`;
                              }
                              if (
                                  !reason &&
                                  observations.some(
                                      observation => !observation.verified
                                  )
                              ) {
                                  const failed = observations
                                      .filter(
                                          observation => !observation.verified
                                      )
                                      .map(
                                          observation =>
                                              `${observation.variant}=${observation.representation}`
                                      )
                                      .join(", ");
                                  reason = `Semantic ${mutation.family} preflight did not construct the requested representation: ${failed}`;
                              }
                              if (
                                  !reason &&
                                  observations.some(
                                      observation =>
                                          observation.siteHitCount < 1
                                  )
                              ) {
                                  const missed = observations
                                      .filter(
                                          observation =>
                                              observation.siteHitCount < 1
                                      )
                                      .map(observation => observation.variant)
                                      .join(", ");
                                  reason = `Semantic ${mutation.family} variants did not each reach exact AST evidence ${mutation.evidenceId}: ${missed}`;
                              }
                              if (
                                  !reason &&
                                  !provesRepresentationTransition(
                                      mutation.family,
                                      observations
                                  )
                              ) {
                                  reason = `Semantic ${mutation.family} preflight did not demonstrate a warmup-to-stress representation transition`;
                              }
                              const candidateOutcome: HotPreflightOutcome = {
                                  obligationId: mutation.obligationId,
                                  evidenceId: mutation.evidenceId,
                                  mutationFamily: mutation.family,
                                  scenarioId: mutation.scenarioId,
                                  sampleId,
                                  status: reason ? "blocked" : "accepted",
                                  siteHitCount:
                                      observations.length > 0
                                          ? Math.min(
                                                ...observations.map(
                                                    observation =>
                                                        observation.siteHitCount
                                                )
                                            )
                                          : 0,
                                  semanticVerification: invocation.sample
                                      .verifyMutation
                                      ? "mutation-verified"
                                      : invocation.sample.verify
                                        ? "result-verified"
                                        : "invocation-only",
                                  mutationPlan: {
                                      mode: mutation.mutation
                                          ? "stable-baseline-to-stress-variants"
                                          : "adapter-owned",
                                      warmupVariants: observations
                                          .filter(
                                              observation =>
                                                  observation.variant ===
                                                  "adapter-baseline"
                                          )
                                          .map(
                                              observation =>
                                                  `${observation.variant}:${observation.representation}`
                                          ),
                                      stressVariants: [
                                          ...new Set(
                                              observations
                                                  .filter(
                                                      observation =>
                                                          observation.variant !==
                                                          "adapter-baseline"
                                                  )
                                                  .map(
                                                      observation =>
                                                          observation.variant
                                                  )
                                          )
                                      ],
                                      excludedVariants,
                                      observations
                                  },
                                  ...(reason ? { reason } : {})
                              };
                              candidateOutcomes.push(candidateOutcome);
                              if (candidateOutcome.status === "accepted") break;
                          }
                          outcomes.push(
                              finalizeHotSampleSelection(
                                  mutation.sampleIds,
                                  candidateOutcomes,
                                  {
                                      obligationId: mutation.obligationId,
                                      evidenceId: mutation.evidenceId,
                                      scenarioId: mutation.scenarioId,
                                      mutationFamily: mutation.family
                                  }
                              )
                          );
                      }
                      /* oxlint-enable no-await-in-loop */
                      return outcomes;
                  },
        async setup({
            runtime,
            scenarios: selectedScenarios,
            preflightOutcomes
        }) {
            const state = await loadModuleState({
                name: runtime.name,
                version: runtime.version,
                engine: runtime.engine,
                engineVersion: runtime.engineVersion
            });
            const blockedScenarios = new Set<string>();
            const selectedSampleByScenario = new Map<string, string>();
            const obligationById = new Map(
                obligations.map(obligation => [obligation.id, obligation])
            );
            const availableSampleIds = new Set(state.samples.keys());
            const selected = new Set(selectedScenarios);
            for (const mutation of mutationPreflights) {
                if (!selected.has(mutation.scenarioId)) continue;
                const matchingOutcomes = preflightOutcomes.filter(
                    outcome =>
                        outcome.obligationId === mutation.obligationId &&
                        outcome.evidenceId === mutation.evidenceId &&
                        outcome.mutationFamily === mutation.family &&
                        outcome.scenarioId === mutation.scenarioId
                );
                const outcome = matchingOutcomes[0];
                if (matchingOutcomes.length !== 1 || !outcome) {
                    throw new Error(
                        `Measurement refused ${mutation.scenarioId}: expected one exact identity-matched semantic preflight outcome, received ${matchingOutcomes.length}`
                    );
                }
                const sampleId = assertHotSelectedSample(
                    mutation.scenarioId,
                    mutation.sampleIds,
                    availableSampleIds,
                    outcome
                );
                const selectedSample = selectedSampleByScenario.get(
                    mutation.scenarioId
                );
                if (selectedSample && selectedSample !== sampleId) {
                    throw new Error(
                        `Measurement refused ${mutation.scenarioId}: obligations selected conflicting samples ${selectedSample} and ${sampleId}`
                    );
                }
                selectedSampleByScenario.set(mutation.scenarioId, sampleId);
                if (outcome.status === "blocked") {
                    blockedScenarios.add(mutation.scenarioId);
                    const obligation = obligationById.get(
                        mutation.obligationId
                    );
                    if (obligation) {
                        obligation.blockedReason =
                            outcome.reason ??
                            `Automatic ${mutation.family} preflight was blocked`;
                    }
                }
            }
            return {
                functions: state.functions,
                samples: state.samples,
                blockedScenarios,
                selectedSampleByScenario,
                preflightByScenario: new Map(
                    selectedScenarios.map(scenarioId => [
                        scenarioId,
                        preflightOutcomes.filter(
                            outcome => outcome.scenarioId === scenarioId
                        )
                    ])
                )
            };
        },
        scenarios,
        options: options.options
    };
};
