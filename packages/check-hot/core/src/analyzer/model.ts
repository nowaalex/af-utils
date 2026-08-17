import type { HotModuleProbeManifest } from "../module-suite.js";
import type {
    HotAstEvidence,
    HotCheckObligation,
    HotExternalModuleBoundary,
    HotPackageTreeIdentity,
    HotPublicFunctionLocator,
    HotPublicModuleIdentity,
    HotRuntimeName,
    HotSourceFileIdentity,
    HotRuntimeLocations
} from "../types.js";

/** Confidence-independent priority assigned to a static risk. */
export type HotAnalysisSeverity = "info" | "warning" | "critical";

/** One potential optimization risk found without executing the code. */
export interface HotAnalysisFinding {
    /** Stable analyzer rule ID. */
    rule: string;
    /** Relative importance for report sorting. */
    severity: HotAnalysisSeverity;
    /** Evidence-based description; it does not claim a measured deoptimization. */
    message: string;
    /** Concrete experiment or source change worth considering. */
    suggestion: string;
    /** Absolute source path. */
    file: string;
    /** One-based source line. */
    line: number;
    /** One-based source column. */
    column: number;
    /** One-based end line. */
    endLine: number;
    /** One-based exclusive end column. */
    endColumn: number;
    /** Zero-based source start offset. */
    start: number;
    /** Exclusive zero-based source end offset. */
    end: number;
    /** Complete source line used by optional human code frames. */
    sourceLine: string;
    /** Every source line intersected by this finding, without CRLF markers. */
    sourceLines: readonly string[];
    /** Candidate ID owning this finding, when known. */
    functionId?: string;
    /** Parameter carrying the proven value flow, when locally resolvable. */
    parameterIndex?: number;
    /** Static destructuring path from that public argument to the proven value. */
    parameterPath?: readonly (string | number)[];
}

/** Static size and operation counts for one function candidate. */
export interface HotAnalysisMetrics {
    /** Physical source lines covered by the function. */
    lines: number;
    /** Conditional and switch branches. */
    branches: number;
    /** Loop statements. */
    loops: number;
    /** Call and constructor expressions. */
    calls: number;
    /** Literal, closure, spread, or constructor allocations inside loops. */
    allocationsInLoops: number;
    /** Non-literal keyed property accesses. */
    dynamicKeyedAccesses: number;
}

/** One function or method ranked as a useful dynamic-check candidate. */
export interface HotAnalysisCandidate {
    /** Stable inferred or annotated ID. */
    id: string;
    /** Local function or method name. */
    name: string;
    /** Declaration category. */
    kind: "function" | "arrow" | "method";
    /** Owning class for a method. */
    className?: string;
    /** Direct runtime export name usable by the low-code module adapter. */
    exportName?: string;
    /** Stable runtime target ID for root, subpath, or namespace exports. */
    targetId?: string;
    /** Structured public locations reaching this exact declaration. */
    publicTargets: readonly HotPublicFunctionLocator[];
    /** Public export paths reaching this declaration from the analyzed entry. */
    publicPaths: readonly string[];
    /** Whether this function is reachable through an exported declaration. */
    exported: boolean;
    /** `check-hot:` marker attached immediately before this declaration. */
    annotation?: string;
    /** Declared JavaScript arity. */
    arity: number;
    /** Identifier parameters used for AST role inference. */
    parameterNames: readonly string[];
    /** Ranking score used only to prioritize scenario authoring. */
    score: number;
    /** Human-readable score contributors. */
    reasons: readonly string[];
    /** Absolute source path. */
    file: string;
    /** Zero-based start offset of the exact owning function node. */
    start: number;
    /** Exclusive zero-based end offset of the exact owning function node. */
    end: number;
    /** SHA-256 of the exact owning function source text. */
    sourceSha256: string;
    /** SHA-256 of source normalized to Function.prototype.toString identity. */
    runtimeSourceSha256: string;
    /** Versioned engine locators derived from the authenticated source AST. */
    runtimeLocations?: HotRuntimeLocations;
    /** One-based declaration line. */
    line: number;
    /** One-based declaration column. */
    column: number;
    /** One-based owning-function end line. */
    endLine: number;
    /** One-based exclusive owning-function end column. */
    endColumn: number;
    /** Static operation counts. */
    metrics: HotAnalysisMetrics;
    /** Potential optimization risks inside this function. */
    findings: readonly HotAnalysisFinding[];
}

/** Complete non-executing analysis of a module graph. */
export interface HotAnalysisReport {
    /** User-provided path or package specifier. */
    input: string;
    /** Resolved JavaScript or TypeScript entry file. */
    entry: string;
    /** SHA-256 of the exact runtime-selected entry artifact. */
    entrySourceSha256: string;
    /** Package-root-relative path of the selected runtime artifact. */
    entryPackagePath: string;
    /** Every concrete public package entry selected by the analyzer. */
    publicEntries: readonly HotPublicModuleIdentity[];
    /** Every parsed source or resolved terminal asset in the runtime graph. */
    sourceGraph: readonly HotSourceFileIdentity[];
    /** Complete package tree, including resolver configs and unselected files. */
    packageTree: HotPackageTreeIdentity;
    /** Runtime condition set used while resolving package exports. */
    runtime: HotRuntimeName;
    /** Nearest package name, when a package manifest was found. */
    packageName?: string;
    /** Exact package version from the nearest named package manifest. */
    packageVersion?: string;
    /** Number of parsed files. */
    files: number;
    /** Parse, truncation, unresolved-edge, or transitive-boundary diagnostics. */
    diagnostics: readonly string[];
    /** Runtime edges intentionally left outside the analyzed package boundary. */
    externalBoundaries: readonly HotExternalModuleBoundary[];
    /** Whether every discoverable runtime edge was resolved and authenticated. */
    graphComplete: boolean;
    /** Node loader required when the analyzed graph contains TypeScript source. */
    sourceLoader?: "tsx";
    /** Ranked function and method candidates. */
    candidates: readonly HotAnalysisCandidate[];
    /** All findings sorted by severity and location. */
    findings: readonly HotAnalysisFinding[];
    /** Typed AST evidence retained independently from prose findings. */
    evidence: readonly HotAstEvidence[];
    /** Dynamic experiments required by all dataflow-proven evidence. */
    obligations: readonly HotCheckObligation[];
    /** Accuracy boundaries that apply to this static report. */
    limitations: readonly string[];
}

/** Options for {@link analyzeHotModule}. */
export interface AnalyzeHotModuleOptions {
    /** File, directory, or installed package specifier. */
    input: string;
    /** Stop graph discovery after this many local files. */
    maxFiles?: number;
    /** Runtime conditional-export branch to analyze. */
    runtime?: HotRuntimeName;
    /** Generated files omitted from the conservative package-tree identity. */
    ignorePackageFiles?: readonly string[];
}

/** Options for generating a low-code suite module. */
export interface GenerateHotSuiteOptions {
    /** Import specifier written into the generated module. */
    importSpecifier: string;
    /** Runtime import specifiers for concrete public package entries. */
    moduleSpecifiers?: readonly {
        modulePath: string;
        importSpecifier: string;
    }[];
    /** External test-runner module written into the generated suite. */
    testRunnerSpecifier?: string;
    /** Versioned sample selection emitted by the isolated probe worker. */
    probeManifest?: HotModuleProbeManifest;
    /** Maximum number of ranked direct exports to include. */
    top?: number;
    /** Explicit public functions selected before disposable probing. */
    functions?: readonly string[];
}

/** Human formatting controls; machine-readable JSON never contains ANSI codes. */
export interface FormatHotAnalysisOptions {
    /** Number of ranked candidates shown. */
    top?: number;
    /** ANSI color policy. */
    color?: "auto" | "always" | "never";
    /** Render a source line and caret range for each shown finding. */
    codeFrame?: boolean;
}
