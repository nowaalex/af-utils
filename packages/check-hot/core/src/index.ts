export type {
    HotAnnotationOptions,
    HotAstEvidence,
    HotCheck,
    HotCheckContext,
    HotCheckPhase,
    HotCorrelationPrecision,
    HotCpuProfileEntry,
    HotCpuProfileSummary,
    HotDiagnosticKind,
    HotCheckObligation,
    HotCoverageLedgerEntry,
    HotEngineInspection,
    HotExternalModuleBoundary,
    HotPhase,
    HotPrepareContext,
    HotPreflightContext,
    HotPreflightOutcome,
    HotRunMode,
    HotRunDiagnostics,
    HotRunResult,
    HotRunSummary,
    HotRuntimeInfo,
    HotRuntimeEvent,
    HotRuntimeName,
    HotScenario,
    HotScenarioContext,
    HotSetupContext,
    HotSuite,
    HotSuiteOptions,
    HotMutationFamily,
    HotMutationObservation,
    HotMutationPlanEvidence,
    HotMutationExclusion,
    HotPackageTreeIdentity,
    HotPublicFunctionLocator,
    HotPublicModuleIdentity,
    HotSourceSpan,
    HotSourceFileIdentity,
    HotTarget,
    HotTargetResult,
    HotWorkerResult,
    JscInspection,
    HotJscSamplingSummary,
    HotV8InlineCacheTransition,
    HotV8LogSummary,
    HotV8MapEdge,
    HotV8MapNode,
    RunHotSuiteOptions,
    V8Inspection,
    V8Tier
} from "./types.js";
export type {
    HotAnalyzerProblemDefinition,
    HotProblemDefinition,
    HotProblemEvidence,
    HotProblemLayer,
    HotProblemOccurrence,
    HotProblemRemediation
} from "./problems/types.js";
export type { HotProblemId } from "./problems/catalog.js";

export {
    getProblemDefinition,
    problemById,
    problemDefinitions
} from "./problems/catalog.js";

export { formatHotRunSummary } from "./report.js";
export {
    HOT_ARTIFACT_SCHEMA_VERSION,
    readHotArtifactBundle
} from "./artifacts/index.js";
export type {
    HotArtifactFile,
    HotArtifactManifest
} from "./artifacts/index.js";
export {
    createModuleSuite,
    loadHotTestRunner,
    rebaseHotEvidence
} from "./module-suite.js";
export { hotPublicTargetId } from "./public-target/index.js";
export {
    detectModuleRuntime,
    discoverModuleFunctions,
    resolveRunnerFunctionLocators,
    selectModuleFunctions
} from "./module-suite.js";
export type {
    HotModuleFunction,
    HotModuleEntryOptions,
    HotModuleCoverageClaim,
    HotModuleMutationInputContext,
    HotModuleMutationVerificationContext,
    HotModulePackage,
    HotModuleProbeFingerprintContext,
    HotModuleProbeManifest,
    HotModuleProbeAttempt,
    HotModuleRuntime,
    HotModuleSample,
    HotModuleSuiteOptions,
    HotModuleTestRunner,
    HotModuleTestRunnerContext
} from "./module-suite.js";

import type {
    HotRunSummary,
    HotSuite,
    HotTarget,
    RunHotSuiteOptions
} from "./types.js";

/** Load Node-only orchestration lazily so runtime workers keep a portable graph. */
export const runHotSuite = async (
    options: RunHotSuiteOptions
): Promise<HotRunSummary> => (await import("./runner.js")).runHotSuite(options);

/** Preserve suite inference while validating a thin adapter declaration. */
export const defineHotSuite = <State>(suite: HotSuite<State>) => suite;

/** Declare a reusable target once and reference it directly from scenarios. */
export const defineHotTarget = <State>(
    id: string,
    resolve: HotTarget<State>["resolve"],
    annotation?: string | false
): HotTarget<State> => ({ id, resolve, annotation });
