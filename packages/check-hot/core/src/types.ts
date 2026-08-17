import type { HotProblemOccurrence } from "./problems/types.js";

/** JavaScript runtime supported by the orchestration core. */
export type HotRuntimeName = "node" | "deno" | "bun";

/** V8 optimization tier requested for a Node.js or Deno run. */
export type V8Tier = "maglev" | "turbofan";

/** Whether scenarios run together or with fresh state per scenario. */
export type HotRunMode = "combined" | "isolated";

/** Lifecycle phase visible to a scenario. */
export type HotPhase = "warmup" | "stress";

/** Lifecycle point at which an invariant is evaluated. */
export type HotCheckPhase = "setup" | "afterWarmup" | "afterStress";

/** Optional diagnostics collected only in a separate, non-gating rerun. */
export type HotDiagnosticKind = "v8-ic-maps" | "cpu-profile" | "jsc-sampling";

/** How precisely one runtime event is correlated with inspected source/work. */
export type HotCorrelationPrecision =
    | "exact-site"
    | "source-line"
    | "target"
    | "scenario"
    | "phase"
    | "name-only"
    | "unavailable";

/** Normalized lifecycle or engine event retained in sequence order. */
export interface HotRuntimeEvent {
    /** Monotonic sequence within `streamId`, never a cross-process clock. */
    sequence: number;
    /** Stable stream owner; separately executed processes never share order. */
    streamId: string;
    /** Worker role that produced this evidence. */
    purpose: "preflight" | "validation" | "measurement" | "diagnostic";
    /** Broad lifecycle phase in which this event occurred. */
    phase:
        | "setup"
        | "warmup"
        | "optimization"
        | "stress"
        | "checks"
        | "teardown"
        | "diagnostic";
    /** Stable event class independent of engine-native wording. */
    kind:
        | "phase-start"
        | "phase-end"
        | "target-tier"
        | "deoptimization"
        | "inline-cache-transition"
        | "map-transition"
        | "sampling-profile"
        | "diagnostic-gap";
    /** Oracle that observed the event. */
    source:
        | "worker-lifecycle"
        | "v8-native-intrinsics"
        | "v8-log"
        | "jsc-public-api"
        | "cpu-profile";
    /** Honest correlation strength; name matches are never exact-site proof. */
    correlation: HotCorrelationPrecision;
    /** Concise human description. */
    message: string;
    /** Scenario when the worker can prove one selected owner. */
    scenarioId?: string;
    /** Analyzer obligation when the scenario has one unambiguous owner. */
    obligationId?: string;
    /** Mutation variant when the collector observes one exact invocation. */
    variant?: string;
    /** Direct target when identity rather than only a function name is known. */
    targetId?: string;
    /** Engine-native function name, which may be ambiguous or minified. */
    functionName?: string;
    /** Engine-native timestamp or tick, when the stream exposes one. */
    engineTimestamp?: number;
    /** Engine-native detail retained for later parsers and reports. */
    detail?: string;
}

/** One CPU-profile function ranked by observed samples, not elapsed time. */
export interface HotCpuProfileEntry {
    /** Runtime function name from the CPU profile. */
    functionName: string;
    /** Source URL when present in the untransformed profile. */
    url?: string;
    /** One-based source line when present. */
    line?: number;
    /** One-based source column when present. */
    column?: number;
    /** Authenticated analyzer candidate, only after an exact owner match. */
    candidateId?: string;
    /** Runtime target, only after exact identity reconciliation. */
    targetId?: string;
    /** Samples attributed to this node or function identity. */
    samples: number;
    /** Fraction of attributable samples across the whole diagnostic process. */
    sampleShare: number;
    /** Source correlation; transformed/empty URLs remain unavailable. */
    correlation: "target" | "source-line" | "name-only" | "unavailable";
}

/** One normalized V8 Map node; IDs are stable only inside one log stream. */
export interface HotV8MapNode {
    /** Stream-local normalized identity such as `map-3`. */
    id: string;
    /** Elements kind parsed from map details, when available. */
    elementsKind?: string;
    /** Own property names parsed from map details. */
    properties: readonly string[];
}

/** One directed V8 hidden-class transition. */
export interface HotV8MapEdge {
    /** Normalized parent map. */
    from: string;
    /** Normalized resulting map. */
    to: string;
    /** Field responsible for the transition, when logged. */
    property?: string;
    /** V8 transition kind. */
    reason: string;
}

/** One normalized V8 inline-cache state transition. */
export interface HotV8InlineCacheTransition {
    /** Stream-local IC site identity derived from code address and source site. */
    siteId: string;
    /** LoadIC, StoreIC, KeyedLoadIC, or another V8 record kind. */
    operation: string;
    /** Previous IC state label from V8. */
    from: string;
    /** New IC state label from V8. */
    to: string;
    /** Normalized observed receiver map, when present in the graph. */
    mapId?: string;
    /** Accessed field/key label when logged. */
    key?: string;
    /** Source line emitted by V8, without claiming original-source identity. */
    line?: number;
    /** Source column emitted by V8. */
    column?: number;
    /** Honest site correlation for this unstable engine log record. */
    correlation: HotCorrelationPrecision;
    /** Authenticated runtime target selected by the enclosing code range. */
    targetId?: string;
    /** Engine-emitted function name used for name-only attribution. */
    functionName?: string;
}

/** Target-identity coverage of one process-global V8 log. */
export interface HotV8TargetScope {
    /** Runtime target IDs requested for diagnostic correlation. */
    requestedTargetIds: readonly string[];
    /** Target IDs for which at least one V8 JS code range was found. */
    matchedTargetIds: readonly string[];
    /** Target IDs absent from the retained V8 code-creation records. */
    unmatchedTargetIds: readonly string[];
    /** IDs whose duplicate function name made name-only attribution unsafe. */
    ambiguousTargetIds: readonly string[];
}

/** Advisory CPU sampling result produced by a separate rerun. */
export interface HotCpuProfileSummary {
    /** Version of check-hot's parser semantics. */
    oracleVersion: "1";
    /** Attributable samples across runtime startup, imports, setup, and workload. */
    totalSamples: number;
    /** Samples whose node ID or frame could not be safely attributed. */
    unattributedSamples: number;
    /** Hottest observed functions in descending sample order. */
    functions: readonly HotCpuProfileEntry[];
    /** Authenticated analyzer candidates for which no sample was observed. */
    unobservedCandidateIds: readonly string[];
    /** Relative artifact path when the raw profile was retained. */
    artifact?: string;
    /** Why sampling could not produce evidence. */
    gap?: string;
}

/** Advisory deep V8 IC/Map result from a separate version-pinned rerun. */
export interface HotV8LogSummary {
    /** Version of check-hot's parser semantics. */
    oracleVersion: "1";
    /** Exact V8 version whose unstable text protocol was parsed. */
    engineVersion: string;
    /** Normalized inline-cache and Map events. */
    events: readonly HotRuntimeEvent[];
    /** Normalized hidden-class graph and IC site histories. */
    graph: {
        maps: readonly HotV8MapNode[];
        transitions: readonly HotV8MapEdge[];
        inlineCaches: readonly HotV8InlineCacheTransition[];
    };
    /** Explicit completeness of target-name scoping in the global engine log. */
    targetScope: HotV8TargetScope;
    /** Relative artifact path for the complete raw V8 log. */
    artifact?: string;
    /** Why feature detection, collection, or parsing was unavailable. */
    gap?: string;
}

/** Tier distribution parsed from Bun's advisory sampling output. */
export interface HotJscSamplingSummary {
    /** Version of check-hot's parser semantics. */
    oracleVersion: "1";
    /** Sampling interval requested from Bun. */
    sampleIntervalMicroseconds: number;
    /** Total samples parsed from Bun's formatted output. */
    totalSamples: number;
    /** Samples grouped by the public JavaScriptCore tier labels. */
    tiers: Readonly<Record<string, { samples: number; percent: number }>>;
    /** Formatted public Bun summaries retained without claiming current tier. */
    functions: string;
    /** Formatted public Bun bytecode/tier summary. */
    bytecodes: string;
    /** Bounded public stack traces retained for verbose offline reports. */
    stackTraces: readonly string[];
    /** Total trace count returned by Bun before bounding. */
    stackTraceCount: number;
    /** Whether trace count or individual trace length exceeded artifact bounds. */
    stackTracesTruncated: boolean;
    /** Why sampling could not produce evidence. */
    gap?: string;
}

/** All advisory evidence from diagnostic reruns for one primary matrix cell. */
export interface HotRunDiagnostics {
    /** Deep V8 inline-cache and Map evidence. */
    v8IcMaps?: HotV8LogSummary;
    /** Runtime-neutral CPU sample ranking. */
    cpuProfile?: HotCpuProfileSummary;
    /** Bun/JavaScriptCore sampling evidence. */
    jscSampling?: HotJscSamplingSummary;
    /** Structured advisory gaps; these never participate in primary pass/fail. */
    problems?: readonly HotProblemOccurrence[];
}

/** Mutation family required to challenge one AST-proven optimization risk. */
export type HotMutationFamily =
    | "allocation-pressure"
    | "array-elements"
    | "callback-identity"
    | "control-flow"
    | "dynamic-code"
    | "numeric-representation"
    | "object-shape"
    | "property-key"
    | "prototype-chain"
    | "return-representation";

/** Exact source range retained for code frames and stable machine reports. */
export interface HotSourceSpan {
    /** Absolute source file path. */
    file: string;
    /** Package-root-relative source locator, stable across installations. */
    relativeFile: string;
    /** SHA-256 of the complete analyzed source file. */
    sourceSha256: string;
    /** Zero-based JavaScript UTF-16 code-unit source offset. */
    start: number;
    /** Exclusive zero-based JavaScript UTF-16 code-unit source offset. */
    end: number;
    /** One-based start line. */
    line: number;
    /** One-based start column. */
    column: number;
    /** One-based end line. */
    endLine: number;
    /** One-based end column. */
    endColumn: number;
}

/** Exact analyzer-derived locator for a supported V8 code-creation record. */
export interface HotV8CodeCreationLocation {
    /** Locator schema owned by check-hot, independent of the V8 log layout. */
    schemaVersion: 1;
    /** Complete source identity authenticated by the analyzer and runner. */
    sourceSha256: string;
    /** One-based V8 code-creation source line. */
    line: number;
    /** One-based V8 code-creation source column. */
    column: number;
    /** Syntax token used as the coordinate anchor. */
    anchor: "parameter-list-start" | "parameter-start" | "async-keyword-start";
    /** Oxc syntax family whose coordinate semantics were proven. */
    syntaxKind:
        | "FunctionDeclaration"
        | "FunctionExpression"
        | "ArrowFunctionExpression"
        | "ObjectMethod"
        | "ObjectGetter"
        | "ObjectSetter"
        | "ClassMethod"
        | "ClassGetter"
        | "ClassSetter";
    /** Whether the owning syntax node is async. */
    async: boolean;
    /** Whether the owning syntax node is a generator. */
    generator: boolean;
    /** Whether the owning class method is static. */
    static: boolean;
    /** Whether the owning method key is computed. */
    computed: boolean;
}

/** Optional engine-specific locations derived without executing source code. */
export interface HotRuntimeLocations {
    /** V8 code-creation locator; consumed only by a compatible V8 oracle. */
    v8CodeCreation?: HotV8CodeCreationLocation;
}

/** Immutable identity for one parsed file in the analyzed runtime graph. */
export interface HotSourceFileIdentity {
    /** Package-root-relative source locator. */
    relativeFile: string;
    /** SHA-256 of the complete analyzed source file. */
    sourceSha256: string;
}

/** Runtime-reachable callable exported from one public package module. */
export interface HotPublicFunctionLocator {
    /** Package export key: `.` for the root or a concrete `./subpath`. */
    modulePath: string;
    /** Property chain from the imported module namespace to the callable. */
    exportPath: readonly string[];
}

/** Analyzer identity for one concrete public package entry. */
export interface HotPublicModuleIdentity {
    /** Package export key: `.` for the root or a concrete `./subpath`. */
    modulePath: string;
    /** Package-root-relative artifact selected by static resolution. */
    entryPackagePath: string;
    /** SHA-256 of the exact selected entry artifact. */
    entrySourceSha256: string;
}

/** Conservative identity of a target package and its resolver inputs. */
export interface HotPackageTreeIdentity {
    /** SHA-256 over sorted relative paths and content identities. */
    sourceSha256: string;
    /** Number of regular files and symbolic links included in the digest. */
    fileCount: number;
    /** Generated files intentionally omitted from both identity passes. */
    ignoredRelativeFiles: readonly string[];
}

/** One source fact emitted by AST traversal with explicit confidence. */
export interface HotAstEvidence {
    /** Stable path-qualified evidence ID. */
    id: string;
    /** Analyzer rule that produced the evidence. */
    rule: string;
    /** Stable candidate ID containing the operation. */
    candidateId: string;
    /** Evidence confidence; dataflow-proven facts may drive argument mutation. */
    confidence: "syntactic" | "dataflow-proven";
    /** Concise operation or value-flow subject. */
    subject: string;
    /** Immutable analyzer proof required before runtime input mutation. */
    automation?: {
        /** Proof schema version. */
        version: 1;
        /** Mutation family mechanically derived from the analyzer rule. */
        mutationFamily: HotMutationFamily;
        /** Public argument binding proven to reach this exact operation. */
        parameterIndex: number;
        /** Literal destructuring path from that public argument. */
        parameterPath: readonly (string | number)[];
    };
    /** Exact source range. */
    span: HotSourceSpan;
    /** Exact function declaration that owns the operation. */
    ownerSpan: HotSourceSpan;
    /** Versioned engine locators for the exact owning function. */
    runtimeLocations?: HotRuntimeLocations;
}

/** One runtime experiment required by an AST-proven source fact. */
export interface HotCheckObligation {
    /** Stable obligation ID. */
    id: string;
    /** Evidence that requires this experiment. */
    evidenceId: string;
    /** Candidate function owning the evidence. */
    candidateId: string;
    /** Exact family a sample must declare to close this obligation. */
    mutationFamily: HotMutationFamily;
    /** Direct public export when automatic invocation is possible. */
    exportName?: string;
    /** Structured public callable identity; never inferred from display text. */
    publicTarget?: HotPublicFunctionLocator;
    /** Zero-based public-function argument carrying the proven value flow. */
    parameterIndex?: number;
    /** Static property/index path from the argument to a destructured value. */
    parameterPath?: readonly (string | number)[];
    /** Why automation cannot currently create a semantically valid sample. */
    blockedReason?: string;
}

/** Terminal per-runtime outcome for one AST obligation. */
export interface HotCoverageLedgerEntry {
    /** Obligation being accounted for. */
    obligationId: string;
    /** Terminal status; reports never silently omit an obligation. */
    status: "passed" | "failed" | "blocked" | "unsupported" | "ignored";
    /** Human-readable evidence for the terminal status. */
    reason: string;
    /** Scenario IDs that exercised the exact mutation family. */
    scenarios: readonly string[];
    /** Dynamic evidence transferred from the disposable preflight. */
    preflight?: HotPreflightOutcome;
    /** Source evidence that created this obligation. */
    evidence?: HotAstEvidence;
}

/** Result of semantic validation performed in a disposable preflight process. */
export interface HotPreflightOutcome {
    /** Exact AST obligation whose generated mutation was validated. */
    obligationId: string;
    /** Scenario that will replay the mutation in a fresh measurement process. */
    scenarioId: string;
    /** Exact semantic sample selected for deterministic measurement replay. */
    sampleId: string;
    /** Exact AST evidence site that must be reached by this scenario. */
    evidenceId: string;
    /** Exact mutation family whose transition was observed. */
    mutationFamily: HotMutationFamily;
    /** Whether the mutation preserved the adapter's semantic contract. */
    status: "accepted" | "blocked";
    /** Actionable explanation when semantic replay cannot be automated. */
    reason?: string;
    /** Number of executions observed for the narrowest enclosing coverage range. */
    siteHitCount?: number;
    /** Strength of the semantic oracle supplied by the sample. */
    semanticVerification:
        | "invocation-only"
        | "result-verified"
        | "mutation-verified";
    /** Explicit baseline/stress variants and their engine observations. */
    mutationPlan?: HotMutationPlanEvidence;
}

/** One runtime observation proving that a requested variant was constructed. */
export interface HotMutationObservation {
    /** Stable variant label from the core mutation plan. */
    variant: string;
    /** Engine-visible representation summary. */
    representation: string;
    /** Whether the representation matches the variant contract. */
    verified: boolean;
    /** Exact AST-site hits measured for this individual invocation. */
    siteHitCount: number;
    /** Hits for the same variant after the full warmup lifecycle. */
    guardedSiteHitCount?: number;
    /** SHA-256 of the receiver/arguments replayed in measurement. */
    replayFingerprint: string;
}

/** Dynamic evidence for stable warmup followed by stress-only transitions. */
export interface HotMutationPlanEvidence {
    /** Phase strategy used by the generated scenario. */
    mode: "stable-baseline-to-stress-variants" | "adapter-owned";
    /** Variants used while training before optimization. */
    warmupVariants: readonly string[];
    /** Variants introduced only after optimization was requested. */
    stressVariants: readonly string[];
    /** Declared stress variants outside the recipe's input contract. */
    excludedVariants: readonly HotMutationExclusion[];
    /** Runtime observations captured in the disposable preflight. */
    observations: readonly HotMutationObservation[];
}

/** One core-generated input excluded from a recipe's documented domain. */
export interface HotMutationExclusion {
    /** Stable core mutation variant label. */
    variant: string;
    /** Bounded adapter explanation retained in the coverage ledger. */
    reason: string;
}

/** Information about the active runtime and optimizing compiler. */
export interface HotRuntimeInfo {
    /** Runtime executable selected by the orchestrator. */
    name: HotRuntimeName;
    /** Runtime version, when exposed by the executable. */
    version: string;
    /** JavaScript engine family. */
    engine: "v8" | "jsc";
    /** JavaScript engine version, when exposed by the runtime. */
    engineVersion?: string;
    /** Requested compiler tier or engine-default optimizing tier. */
    tier: V8Tier | "jsc";
    /** Stable implementation ID for the engine oracle used by this worker. */
    oracleId: "v8-native-intrinsics" | "bun-jsc-public-api";
    /** Version of the oracle semantics encoded in machine-readable reports. */
    oracleVersion: string;
}

/** V8-only representation and optimization probes available to checks. */
export interface V8Inspection {
    /** Engine discriminator. */
    kind: "v8";
    /** Return whether two values currently have the same V8 map. */
    sameMap(left: object, right: object): boolean;
    /** Return whether an object uses V8 fast named properties. */
    hasFastProperties(value: object): boolean;
    /** Return whether an object uses dictionary elements. */
    hasDictionaryElements(value: object): boolean;
    /** Return the ordinary-array elements kind relevant to hot-path checks. */
    arrayElementsKind(
        value: unknown[]
    ): "SMI" | "DOUBLE" | "OBJECT" | "UNKNOWN";
    /** Return whether an ordinary array is packed and uses fast elements. */
    isPackedArray(value: unknown[]): boolean;
    /** Return whether a numeric value is represented as a V8 SMI. */
    isSmi(value: number): boolean;
    /** Return the raw V8 optimization status bitset. */
    optimizationStatus(value: CallableFunction): number;
    /** Print V8's diagnostic representation for a value. */
    debugPrint(value: unknown): void;
}

/** JavaScriptCore probes exposed by Bun's `bun:jsc` module. */
export interface JscInspection {
    /** Engine discriminator. */
    kind: "jsc";
    /** Return JavaScriptCore's diagnostic description of a value. */
    describe(value: unknown): string;
    /** Return JavaScriptCore's diagnostic description of an array. */
    describeArray(value: unknown[]): string;
}

/** Engine-specific probes available to invariant callbacks. */
export type HotEngineInspection = V8Inspection | JscInspection;

/** Context supplied while a suite creates fresh scenario state. */
export interface HotSetupContext {
    /** Active runtime and compiler tier. */
    runtime: HotRuntimeInfo;
    /** Whether verbose representation diagnostics were requested. */
    inspect: boolean;
    /** Scenarios selected for this fresh measurement process. */
    scenarios: readonly string[];
    /** Outcomes produced by a separate, already-discarded preflight process. */
    preflightOutcomes: readonly HotPreflightOutcome[];
}

/** Context supplied to a disposable semantic preflight process. */
export interface HotPreflightContext {
    /** Active runtime and compiler tier. */
    runtime: HotRuntimeInfo;
    /** Whether verbose diagnostics were requested. */
    inspect: boolean;
    /** Scenarios that the subsequent fresh measurement process will execute. */
    scenarios: readonly string[];
    /** Observe whether a generated value has the requested engine representation. */
    observeMutation?: (
        family: HotMutationFamily,
        seed: unknown,
        value: unknown,
        variant: string
    ) => Omit<HotMutationObservation, "siteHitCount" | "replayFingerprint">;
    /** Execute one invocation while measuring its exact evidence site alone. */
    measureEvidence?<Value>(
        evidenceId: string,
        target: CallableFunction,
        action: () => Value | Promise<Value>
    ): Promise<{ value: Value; siteHitCount: number }>;
}

/** Context supplied to every scenario iteration. */
export interface HotScenarioContext<State> {
    /** Fresh state returned by the suite setup callback. */
    state: State;
    /** Active warmup or guarded stress phase. */
    phase: HotPhase;
    /** Zero-based iteration within the current scenario phase. */
    iteration: number;
    /** Active runtime and compiler tier. */
    runtime: HotRuntimeInfo;
    /**
     * Invoke a registered target while recording that the scenario reached it.
     * Nested targets may instead be called naturally by the library.
     */
    invoke(
        target: string | HotTarget<State>,
        receiver: unknown,
        args?: readonly unknown[]
    ): unknown;
}

/** Context supplied to invariant callbacks. */
export interface HotCheckContext<State> {
    /** Fresh suite state. */
    state: State;
    /** Active runtime and compiler tier. */
    runtime: HotRuntimeInfo;
    /** Engine-specific diagnostic probes. */
    engine: HotEngineInspection;
    /** Whether verbose representation diagnostics were requested. */
    inspect: boolean;
    /** Fail the current invariant when a condition is false. */
    expect(condition: unknown, message: string): asserts condition;
}

/** One function whose optimized state must survive its declared scenarios. */
export interface HotTarget<State> {
    /** Stable target ID used by scenarios, reports, and source annotations. */
    id: string;
    /** Resolve the exact runtime function after suite setup. */
    resolve: (state: State) => CallableFunction;
    /**
     * Source marker matched by annotation validation. `false` opts a generated
     * or per-instance target out; otherwise the target ID is used by default.
     */
    annotation?: string | false;
    /** Require direct invocation during both warmup and guarded stress. */
    requireInvocation?: boolean;
}

/** A repeatable state transition that exercises one or more hot targets. */
export interface HotScenario<State> {
    /** Stable scenario ID shown in isolated-run reports. */
    id: string;
    /** Targets that this scenario promises to exercise. */
    targets: readonly (string | HotTarget<State>)[];
    /** AST obligations whose exact mutation family this scenario exercises. */
    obligations?: readonly string[];
    /** Optional warmup override for this scenario. */
    warmupIterations?: number;
    /** Optional guarded-stress override for this scenario. */
    stressIterations?: number;
    /** Optional setup executed once before each phase. */
    before?: (context: HotScenarioContext<State>) => void | Promise<void>;
    /** Execute one deterministic scenario iteration. */
    run: (context: HotScenarioContext<State>) => void | Promise<void>;
    /** Optional cleanup or correctness assertion executed after each phase. */
    after?: (context: HotScenarioContext<State>) => void | Promise<void>;
}

/** One engine-aware representation or correctness invariant. */
export interface HotCheck<State> {
    /** Stable check ID shown in reports. */
    id: string;
    /** Lifecycle point at which the check runs. */
    phase?: HotCheckPhase;
    /** Limit the check to selected engine families. */
    engines?: readonly ("v8" | "jsc")[];
    /** Run only when at least one of these scenarios is selected. */
    scenarios?: readonly string[];
    /** Evaluate the invariant, throwing or using `expect` on failure. */
    run: (context: HotCheckContext<State>) => void | Promise<void>;
}

/** Source discovery contract for language-independent `check-hot:` comments. */
export interface HotAnnotationOptions {
    /** Files or directories scanned recursively from the configured base. */
    roots: readonly string[];
    /** Resolve roots from the process cwd or the suite module directory. */
    relativeTo?: "cwd" | "suite";
    /** Source extensions to scan, including the leading dot. */
    extensions?: readonly string[];
    /** Require every non-opted-out target to have a matching source marker. */
    requireTargets?: boolean;
}

/** Default execution matrix owned by a suite. */
export interface HotSuiteOptions {
    /** Runtimes included when the CLI does not override them. */
    runtimes?: readonly HotRuntimeName[];
    /** V8 tiers included for Node.js and Deno. */
    v8Tiers?: readonly V8Tier[];
    /** Combined and/or fresh-state isolated scenario modes. */
    modes?: readonly HotRunMode[];
    /** Number of fresh-process repetitions for every matrix cell. */
    repetitions?: number;
    /** Default warmup iterations per scenario. */
    warmupIterations?: number;
    /** Default guarded-stress iterations per scenario. */
    stressIterations?: number;
    /** Fail on every stress deopt, only direct targets (default), or none. */
    deoptScope?: "all" | "targets" | "none";
    /** Maximum captured output per worker process. */
    maxBufferBytes?: number;
    /** Hard wall-clock limit for each fresh worker process. */
    timeoutMs?: number;
}

/** Worker-only preparation that authenticates runtime-selected artifacts. */
export interface HotPrepareContext {
    /** Exact runtime that imported this suite module. */
    runtime: HotRuntimeInfo;
}

/** One statically resolved runtime edge that leaves the analyzed package. */
export interface HotExternalModuleBoundary {
    /** Package-root-relative source file containing the edge. */
    importer: string;
    /** Literal module specifier used by the source. */
    request: string;
    /** Loader branch selected for conditional exports. */
    mode: "import" | "require";
    /** External package name, when its manifest declares one. */
    packageName?: string;
    /** Exact installed external package version, when declared. */
    packageVersion?: string;
    /** Path of the selected artifact relative to the external package root. */
    packageRelativeFile: string;
}

/** Complete adapter contract consumed by the thick orchestration core. */
export interface HotSuite<State = unknown> {
    /** Human-readable suite name. */
    name: string;
    /** Node loader needed by suite dependencies, independent of target-source transformation. */
    workerLoader?: "tsx";
    /** Environment variables supplied only to fresh runtime workers. */
    environment?: Readonly<Record<string, string>>;
    /** Versioned external seed adapter and disposable-probe fingerprint. */
    adapter?: {
        /** Adapter protocol ID. */
        id: string;
        /** Exact adapter implementation version. */
        version: string;
        /** SHA-256 of the adapter entry source accepted by the probe. */
        sourceSha256: string;
        /** SHA-256 of the adapter package tree accepted by the probe. */
        packageTreeSha256: string;
        /** Runtime that accepted the replayed semantic seeds. */
        probeRuntime: HotRuntimeName;
        /** Exact probe runtime version. */
        probeRuntimeVersion: string;
    };
    /** AST evidence preserved from analysis for traceable reports. */
    evidence?: readonly HotAstEvidence[];
    /** Complete set of AST-proven experiments requiring terminal outcomes. */
    obligations?: readonly HotCheckObligation[];
    /** Static graph provenance retained by generated suites. */
    analysis?: {
        /** Runtime condition set that selected the analyzed source graph. */
        runtime?: HotRuntimeName;
        /** SHA-256 of the exact entry artifact selected during analysis. */
        entrySourceSha256?: string;
        /** Package-root-relative path selected by the analyzer resolver. */
        entryPackagePath?: string;
        /** Every public package entry selected during static analysis. */
        publicEntries?: readonly HotPublicModuleIdentity[];
        /** Every parsed source or resolved terminal asset in the runtime graph. */
        sourceGraph?: readonly HotSourceFileIdentity[];
        /** Complete package tree that detects resolver-sensitive additions. */
        packageTree?: HotPackageTreeIdentity;
        /** Whether every statically discoverable edge was resolved and authenticated. */
        graphComplete: boolean;
        /** Unresolved edges, truncation, and transitive-boundary diagnostics. */
        diagnostics: readonly string[];
        /** Resolved runtime edges intentionally outside the analyzed package. */
        externalBoundaries?: readonly HotExternalModuleBoundary[];
        /** Node loader needed by a TypeScript, TSX, or JSX source graph. */
        sourceLoader?: "tsx";
    };
    /** Authenticate and rebase source evidence inside the fresh worker. */
    prepare?: (context: HotPrepareContext) => void | Promise<void>;
    /**
     * Validate generated mutations in a disposable process. The orchestrator
     * discards this process before creating measurement state.
     */
    preflight?: (
        context: HotPreflightContext
    ) =>
        | readonly HotPreflightOutcome[]
        | Promise<readonly HotPreflightOutcome[]>;
    /** Create fresh state for one worker process. */
    setup: (context: HotSetupContext) => State | Promise<State>;
    /** Release resources retained by the fresh suite state. */
    teardown?: (state: State) => void | Promise<void>;
    /**
     * Exact functions guarded by final optimization checks. May be omitted
     * when scenarios reference target objects directly.
     */
    targets?: readonly HotTarget<State>[];
    /** Named workloads used for warmup and guarded stress. */
    scenarios: readonly HotScenario<State>[];
    /** Representation and correctness invariants evaluated around scenarios. */
    checks?: readonly HotCheck<State>[];
    /** Optional source-marker coverage validation. */
    annotations?: HotAnnotationOptions;
    /** Default runtime and stress matrix. */
    options?: HotSuiteOptions;
}

/** Programmatic overrides accepted by {@link runHotSuite}. */
export interface RunHotSuiteOptions {
    /** Suite module path or file URL. */
    suite: string | URL;
    /** Limit execution to selected scenario IDs. */
    scenarios?: readonly string[];
    /** Override suite runtime defaults. */
    runtimes?: readonly HotRuntimeName[];
    /** Override suite V8 tier defaults. */
    v8Tiers?: readonly V8Tier[];
    /** Override suite isolation-mode defaults. */
    modes?: readonly HotRunMode[];
    /** Override the fresh-process repetition count. */
    repetitions?: number;
    /** Maximum matrix cells executed concurrently; defaults to one. */
    concurrency?: number;
    /** Override the suite warmup iteration count. */
    warmupIterations?: number;
    /** Override the suite guarded-stress iteration count. */
    stressIterations?: number;
    /** Override which guarded V8 deoptimizations fail a run; defaults to targets. */
    deoptScope?: "all" | "targets" | "none";
    /** Override the maximum captured output per worker process. */
    maxBufferBytes?: number;
    /** Override the hard wall-clock limit for each worker process. */
    timeoutMs?: number;
    /** Override runtime executable names or paths. */
    executables?: Partial<Record<HotRuntimeName, string>>;
    /** Append runtime-specific command-line arguments before the worker. */
    runtimeArgs?: Partial<Record<HotRuntimeName, readonly string[]>>;
    /** Print verbose engine representations requested by suite checks. */
    inspect?: boolean;
    /** Print captured worker output for successful runs. */
    verbose?: boolean;
    /** Write the complete machine-readable summary to this path. */
    jsonOutput?: string;
    /** Write a versioned, offline-inspectable artifact bundle to a new directory. */
    artifactOutput?: string;
    /** Advisory diagnostics run separately from the primary gating workers. */
    diagnostics?: readonly HotDiagnosticKind[];
    /** Diagnostic-specific guarded-stress budgets for differently sized artifacts. */
    diagnosticStressIterations?: Partial<Record<HotDiagnosticKind, number>>;
    /** Maximum bytes read from any one diagnostic profile/log artifact. */
    diagnosticMaxBytes?: number;
}

/** Fields shared by V8 and JavaScriptCore target observations. */
export interface HotTargetResultBase {
    /** Stable target ID. */
    id: string;
    /** Runtime function name after build transforms. */
    functionName: string;
    /** Engine that produced this observation. */
    engine: "v8" | "jsc";
}

/** Exact V8 tier observation made with native intrinsics. */
export interface V8TargetResult extends HotTargetResultBase {
    /** Engine discriminator. */
    engine: "v8";
    /** Whether the requested V8 tier remained active after guarded stress. */
    optimized: boolean;
    /** Tier requested by the matrix cell. */
    requestedTier: V8Tier;
    /** Tier observed through V8's active-tier intrinsics. */
    activeTier: V8Tier | "none" | "other-optimized";
    /** Raw V8 optimization status bitset. */
    status: number;
}

/** Historical JavaScriptCore compilation evidence exposed by Bun. */
export interface JscTargetResult extends HotTargetResultBase {
    /** Engine discriminator. */
    engine: "jsc";
    /** Whether the function compiled with DFG at least once. */
    compiledHistorically: boolean;
    /** Bun does not expose the function's currently attached JSC tier. */
    currentTier: "not-observable";
    /** JavaScriptCore DFG compilation count. */
    dfgCompiles: number;
    /** JavaScriptCore reoptimization retry count after stress. */
    reoptimizationRetries: number;
    /** JavaScriptCore cumulative compile time, when available. */
    compileTime: number;
}

/** One direct target's final engine-specific state. */
export type HotTargetResult = V8TargetResult | JscTargetResult;

/** One isolated worker's structured result. */
export interface HotWorkerResult {
    /** Suite name. */
    suite: string;
    /** Runtime/compiler information. */
    runtime: HotRuntimeInfo;
    /** External adapter/probe fingerprint, when a seed provider was used. */
    adapter?: HotSuite["adapter"];
    /** Scenario IDs exercised in this process. */
    scenarios: readonly string[];
    /** Final direct-target states. */
    targets: readonly HotTargetResult[];
    /** Successful invariant IDs. */
    checks: readonly string[];
    /** Direct invocation counts recorded through the scenario context. */
    invocations: Readonly<Record<string, number>>;
    /** Terminal outcome for every suite obligation in this runtime process. */
    coverage: readonly HotCoverageLedgerEntry[];
    /** Semantic mutation outcomes emitted only by a disposable preflight. */
    preflight?: readonly HotPreflightOutcome[];
    /** Structured problem occurrences emitted by feature-owned checkers. */
    problems: readonly HotProblemOccurrence[];
    /** Ordered lifecycle and engine events emitted by this worker. */
    events: readonly HotRuntimeEvent[];
    /** Advisory engine sampling captured only in a diagnostic worker. */
    diagnostics?: Pick<HotRunDiagnostics, "jscSampling">;
}

/** One cell in the runtime/tier/scenario/repetition matrix. */
export interface HotRunResult {
    /** Runtime used for the worker. */
    runtime: HotRuntimeName;
    /** Requested tier. */
    tier: V8Tier | "jsc";
    /** Combined or isolated scenario mode. */
    mode: HotRunMode;
    /** Scenario IDs selected for the worker. */
    scenarios: readonly string[];
    /** One-based repetition number. */
    repetition: number;
    /** Worker wall time in milliseconds. */
    durationMs: number;
    /** Whether the complete matrix cell passed. */
    passed: boolean;
    /** Structured worker result, when the worker reached reporting. */
    worker?: HotWorkerResult;
    /** Terminal ledger entries, including synthetic crash/timeout outcomes. */
    coverage: readonly HotCoverageLedgerEntry[];
    /** Guarded V8 deoptimization trace lines. */
    deoptimizations: readonly string[];
    /** Structured runtime/infrastructure problems for this matrix cell. */
    problems: readonly HotProblemOccurrence[];
    /** Captured standard output. */
    stdout: string;
    /** Captured standard error. */
    stderr: string;
    /** Full worker command, suitable for reproducing this matrix cell. */
    command: readonly string[];
    /** Ordered primary and advisory events; diagnostics never affect pass/fail. */
    events: readonly HotRuntimeEvent[];
    /** Results of structurally separate, non-gating diagnostic reruns. */
    diagnostics?: HotRunDiagnostics;
    /** Relative files used when this run was serialized into an artifact bundle. */
    artifacts?: {
        stdout: string;
        stderr: string;
        command: string;
        events: string;
    };
}

/** Aggregate result returned by {@link runHotSuite}. */
export interface HotRunSummary {
    /** Suite name. */
    suite: string;
    /** Runtime/tier/scenario matrix cells. */
    runs: readonly HotRunResult[];
    /** Suite-level annotation, graph, and aggregate coverage problems. */
    problems: readonly HotProblemOccurrence[];
    /** Whether every AST obligation passed at least one exact-family scenario. */
    coverageComplete: boolean;
    /** Whether annotations and every matrix cell passed. */
    passed: boolean;
    /** Artifact schema that serialized this summary, when collected. */
    artifactSchemaVersion?: "1";
}
