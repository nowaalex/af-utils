import type { AstNode } from "../../ast.js";
import type { HotAnalysisMetrics } from "../../model.js";
import { defineAnalyzerProblems } from "../shared.js";
import type { AddFinding } from "../shared.js";

const complexityGuidance = {
    likelyCauses: [
        "A large function or dense branch graph increases compilation and coverage complexity."
    ],
    confirmWith: [
        "Use CPU hotness evidence and isolated branch scenarios before attributing a runtime cost to size alone."
    ],
    remediations: [
        {
            action: "Split independently hot branch families into smaller functions.",
            when: "Runtime evidence shows compilation, inlining, or coverage pressure and the split preserves semantics."
        }
    ]
} as const;

/** Rules implemented by this feature. */
export const ruleDefinitions = defineAnalyzerProblems(
    "compilation-complexity",
    [
        {
            id: "large-complex-function",
            title: "Large or branch-heavy function",
            mutationFamily: "control-flow",
            runtimeExperiment: false,
            ...complexityGuidance
        }
    ] as const
);

/** Report a candidate whose size makes scenario and tiering coverage harder. */
export const finishCompilationComplexity = (
    owner: AstNode,
    metrics: HotAnalysisMetrics,
    addFinding: AddFinding
) => {
    if (metrics.lines < 100 && metrics.branches < 16) return;
    addFinding(
        "large-complex-function",
        "info",
        `The function spans ${metrics.lines} lines and has ${metrics.branches} branch nodes, making tiering and scenario coverage harder to reason about.`,
        "Split report scenarios by major branch family; refactor only if profiling shows compilation or inlining pressure.",
        owner
    );
};
