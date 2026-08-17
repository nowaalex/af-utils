import type { AstNode } from "../ast.js";
import type { ParameterFlow } from "../internal-model.js";
import type { HotAnalysisSeverity } from "../model.js";
import type { HotMutationFamily } from "../../types.js";
import type { HotAnalyzerProblemDefinition } from "../../problems/types.js";

/** Static rule metadata owned next to the corresponding detector. */
export interface RuleDefinition extends HotAnalyzerProblemDefinition {
    mutationFamily: HotMutationFamily;
}

type AnalyzerProblemInput = Pick<
    RuleDefinition,
    | "id"
    | "title"
    | "mutationFamily"
    | "runtimeExperiment"
    | "likelyCauses"
    | "confirmWith"
    | "remediations"
>;

/** Add shared catalog metadata without repeating it in every feature rule. */
export const defineAnalyzerProblems = <
    const Definitions extends readonly AnalyzerProblemInput[]
>(
    feature: string,
    definitions: Definitions
) =>
    definitions.map(definition => ({
        ...definition,
        feature,
        layer: "analysis" as const,
        outcome: "risk" as const,
        evidence: "static-hypothesis" as const,
        documentation: `src/analyzer/rules/${feature}/README.md`
    })) as unknown as {
        readonly [Index in keyof Definitions]: Definitions[Index] &
            Pick<
                RuleDefinition,
                | "feature"
                | "layer"
                | "outcome"
                | "evidence"
                | "likelyCauses"
                | "confirmWith"
                | "remediations"
                | "documentation"
            >;
    };

/** Common finding sink shared by feature-local detectors. */
export type AddFinding = (
    rule: string,
    severity: HotAnalysisSeverity,
    message: string,
    suggestion: string,
    node: AstNode,
    parameterFlow?: ParameterFlow
) => void;

/** Resolve a node-like value to a proven public-parameter origin. */
export type ResolveParameterFlow = (
    value: unknown
) => ParameterFlow | undefined;
