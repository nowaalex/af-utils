import { isNode } from "../../ast.js";
import type { AstNode } from "../../ast.js";
import type { HotAnalysisMetrics } from "../../model.js";
import { expressionKind } from "../syntax.js";
import type { AddFinding, ResolveParameterFlow } from "../shared.js";
import { defineAnalyzerProblems } from "../shared.js";

const propertyKeyGuidance = {
    likelyCauses: [
        "One keyed access observes string, numeric-index, symbol, or receiver-map diversity."
    ],
    confirmWith: [
        "Run string, index, and symbol variants accepted by the API and inspect keyed inline-cache transitions."
    ],
    remediations: [
        {
            action: "Separate key families or normalize keys at the API boundary.",
            when: "Deep engine evidence confirms a harmful polymorphic or megamorphic keyed access."
        }
    ]
} as const;

/** Rules implemented by this feature. */
export const ruleDefinitions = defineAnalyzerProblems("property-key", [
    {
        id: "dynamic-keyed-access",
        title: "Dynamic property-key access",
        mutationFamily: "property-key",
        runtimeExperiment: true,
        ...propertyKeyGuidance
    },
    {
        id: "dynamic-keyed-access-in-loop",
        title: "Dynamic property-key access inside a loop",
        mutationFamily: "property-key",
        runtimeExperiment: true,
        ...propertyKeyGuidance
    }
] as const);

/** Find a non-literal computed key and retain a proven key-argument origin. */
export const detectPropertyKey = (
    node: AstNode,
    insideLoop: boolean,
    metrics: HotAnalysisMetrics,
    directParameterReference: ResolveParameterFlow,
    addFinding: AddFinding
) => {
    if (node.type !== "MemberExpression" || node.computed !== true) return;
    const propertyKind = expressionKind(node.property);
    if (propertyKind === "string" || propertyKind === "number") return;
    metrics.dynamicKeyedAccesses++;
    addFinding(
        insideLoop ? "dynamic-keyed-access-in-loop" : "dynamic-keyed-access",
        insideLoop ? "warning" : "info",
        insideLoop
            ? "A loop performs keyed access with a dynamic key; changing key/value shapes can make its inline cache polymorphic or megamorphic."
            : "The function performs keyed access with a dynamic key, so its inline cache may observe multiple key classes.",
        insideLoop
            ? "Add isolated scenarios for stable and mixed key types, then inspect keyed-access deopts before rewriting the code."
            : "Exercise the proven key source with string, index, and symbol families when the API accepts them.",
        node,
        isNode(node.property)
            ? directParameterReference(node.property)
            : undefined
    );
};
