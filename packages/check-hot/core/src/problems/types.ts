import type { HotMutationFamily } from "../types.js";
import type { HotProblemId } from "./catalog.js";

/** Architectural layer that can prove or report a check-hot problem. */
export type HotProblemLayer =
    | "analysis"
    | "coverage"
    | "runtime"
    | "integrity"
    | "infrastructure";

/** Strength of evidence needed before a problem may be reported as confirmed. */
export type HotProblemEvidence =
    | "static-hypothesis"
    | "runtime-measurement"
    | "engine-confirmed"
    | "proof-gap";

/** One conditional action that may address a confirmed problem. */
export interface HotProblemRemediation {
    /** Short action suitable for the human report. */
    action: string;
    /** Condition under which the action is appropriate. */
    when: string;
}

/** Stable, human-discoverable description of one supported problem class. */
export interface HotProblemDefinition {
    /** Stable ID used by findings, runtime occurrences, JSON, and reports. */
    id: string;
    /** Short human title suitable for report headings. */
    title: string;
    /** Feature folder owning detection, documentation, and tests. */
    feature: string;
    /** Layer that produces evidence for this problem. */
    layer: HotProblemLayer;
    /** Whether the result is a hypothesis, a measured failure, or a proof gap. */
    outcome: "risk" | "failure" | "gap";
    /** Evidence boundary readers must preserve when interpreting occurrences. */
    evidence: HotProblemEvidence;
    /** Common mechanisms capable of producing this problem. */
    likelyCauses: readonly string[];
    /** Follow-up observations that can confirm or narrow the diagnosis. */
    confirmWith: readonly string[];
    /** Conditional remedies; none is presented as universally correct. */
    remediations: readonly HotProblemRemediation[];
    /** Package-relative README describing bad/good examples and proof limits. */
    documentation: string;
}

/** Analyzer-owned problem metadata kept beside its AST detector. */
export interface HotAnalyzerProblemDefinition extends HotProblemDefinition {
    layer: "analysis";
    outcome: "risk";
    /** Generic mutation family able to exercise this fact, when sound. */
    mutationFamily: HotMutationFamily;
    /** Whether this detector can create an automatic runtime obligation. */
    runtimeExperiment: boolean;
}

/** One concrete occurrence produced by a runtime or coverage checker. */
export interface HotProblemOccurrence {
    /** Stable catalog problem ID. */
    problemId: HotProblemId;
    /** Actionable explanation for this exact occurrence. */
    message: string;
    /** Scenario target associated with the occurrence, when known. */
    targetId?: string;
    /** Engine-native detail retained for JSON and verbose reports. */
    detail?: string;
    /** Confidence of this occurrence, kept distinct from definition evidence. */
    confidence?: "low" | "medium" | "high";
}
