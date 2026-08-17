import type { AstNode } from "../../ast.js";
import type { HotAnalysisMetrics } from "../../model.js";
import { defineAnalyzerProblems } from "../shared.js";
import type { AddFinding } from "../shared.js";

const loopGuidance = {
    likelyCauses: [
        "Repeated allocation or exceptional/asynchronous control flow occurs inside a loop."
    ],
    confirmWith: [
        "Run a representative large-input scenario and inspect allocation, GC, and branch-specific runtime evidence."
    ],
    remediations: [
        {
            action: "Hoist reusable state or separate exceptional/asynchronous work from the synchronous loop.",
            when: "Profiling confirms the reported operation dominates the real hot workload."
        }
    ]
} as const;

/** Rules implemented by this feature. */
export const ruleDefinitions = defineAnalyzerProblems("loop-pressure", [
    {
        id: "allocation-in-loop",
        title: "Allocation pressure inside a loop",
        mutationFamily: "allocation-pressure",
        runtimeExperiment: false,
        ...loopGuidance
    },
    {
        id: "control-flow-in-loop",
        title: "Exceptional or asynchronous control flow inside a loop",
        mutationFamily: "control-flow",
        runtimeExperiment: false,
        ...loopGuidance
    }
] as const);

/** Loop node kinds shared with the single candidate traversal. */
export const loopTypes = new Set([
    "DoWhileStatement",
    "ForInStatement",
    "ForOfStatement",
    "ForStatement",
    "WhileStatement"
]);

/** Count allocation-shaped work and flag expensive control flow inside loops. */
export const detectLoopPressure = (
    node: AstNode,
    insideLoop: boolean,
    metrics: HotAnalysisMetrics,
    addFinding: AddFinding
) => {
    if (!insideLoop) return;
    if (
        node.type === "ArrayExpression" ||
        node.type === "ObjectExpression" ||
        node.type === "NewExpression" ||
        node.type === "ArrowFunctionExpression" ||
        node.type === "FunctionExpression" ||
        node.type === "SpreadElement"
    ) {
        metrics.allocationsInLoops++;
    }
    if (
        node.type === "AwaitExpression" ||
        node.type === "YieldExpression" ||
        node.type === "TryStatement"
    ) {
        addFinding(
            "control-flow-in-loop",
            "warning",
            `${node.type} appears inside a loop and may dominate allocation or exception costs.`,
            "Measure this branch separately from the synchronous fast path and include both success and failure scenarios.",
            node
        );
    }
};

/** Emit the aggregate allocation-pressure hypothesis. */
export const finishLoopPressure = (
    owner: AstNode,
    metrics: HotAnalysisMetrics,
    addFinding: AddFinding
) => {
    if (metrics.allocationsInLoops < 1) return;
    addFinding(
        "allocation-in-loop",
        metrics.allocationsInLoops > 3 ? "warning" : "info",
        `${metrics.allocationsInLoops} allocation-shaped expression(s) occur inside loops.`,
        "Profile allocation and GC before changing code; add a large-input stress scenario to make the cost visible.",
        owner
    );
};
