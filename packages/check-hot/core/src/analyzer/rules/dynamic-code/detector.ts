import { nodeName } from "../../ast.js";
import type { AstNode } from "../../ast.js";
import { defineAnalyzerProblems } from "../shared.js";
import type { AddFinding } from "../shared.js";

const dynamicCodeGuidance = {
    likelyCauses: [
        "Direct eval makes bindings and control flow dependent on runtime source text."
    ],
    confirmWith: [
        "Exercise the evaluated branch explicitly and inspect whether the containing function can reach and retain the requested tier."
    ],
    remediations: [
        {
            action: "Move dynamic compilation outside the hot function or replace it with an explicit operation table.",
            when: "The dynamic code is controllable and runtime evidence shows it prevents a stable hot path."
        }
    ]
} as const;

/** Rules implemented by this feature. */
export const ruleDefinitions = defineAnalyzerProblems("dynamic-code", [
    {
        id: "dynamic-eval",
        title: "Direct dynamic eval",
        mutationFamily: "dynamic-code",
        runtimeExperiment: false,
        ...dynamicCodeGuidance
    }
] as const);

/** Report an unshadowed direct eval, which also blocks automatic dataflow proof. */
export const detectDynamicCode = (
    node: AstNode,
    declaredNames: ReadonlySet<string>,
    addFinding: AddFinding
) => {
    if (
        node.type !== "CallExpression" ||
        nodeName(node.callee) !== "eval" ||
        declaredNames.has("eval")
    ) {
        return;
    }
    addFinding(
        "dynamic-eval",
        "critical",
        "Direct eval limits optimization and makes static reasoning incomplete.",
        "Keep evaluated code outside hot functions and cover this path with an explicit scenario if it cannot be removed.",
        node
    );
};
