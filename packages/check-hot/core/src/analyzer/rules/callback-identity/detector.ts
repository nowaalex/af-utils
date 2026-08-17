import { isNode, nodeName } from "../../ast.js";
import type { AstNode } from "../../ast.js";
import { memberPropertyName, unwrapExpression } from "../syntax.js";
import type { AddFinding, ResolveParameterFlow } from "../shared.js";
import { defineAnalyzerProblems } from "../shared.js";

const callbackGuidance = {
    likelyCauses: ["A call site observes several callback identities."],
    confirmWith: [
        "Exercise stable, polymorphic, and megamorphic callback families and inspect call-site engine evidence."
    ],
    remediations: [
        {
            action: "Reuse callback identities or deliberately warm the bounded callback family.",
            when: "The real call site becomes unstable and callback allocation is not semantically required."
        }
    ]
} as const;

/** Rules implemented by this feature. */
export const ruleDefinitions = defineAnalyzerProblems("callback-identity", [
    {
        id: "callback-parameter-call",
        title: "Callback parameter call-site identity",
        mutationFamily: "callback-identity",
        runtimeExperiment: true,
        ...callbackGuidance
    },
    {
        id: "callback-parameter-flow",
        title: "Callback parameter collection flow",
        mutationFamily: "callback-identity",
        runtimeExperiment: true,
        ...callbackGuidance
    }
] as const);

const callbackConsumingMethods = new Set([
    "every",
    "filter",
    "find",
    "findIndex",
    "flatMap",
    "forEach",
    "map",
    "reduce",
    "reduceRight",
    "some",
    "sort"
]);

/** Find direct calls through a proven callback parameter or alias. */
export const detectCallbackCall = (
    node: AstNode,
    directParameterReference: ResolveParameterFlow,
    reportedStarts: Set<number>,
    addFinding: AddFinding
) => {
    if (node.type !== "CallExpression" || reportedStarts.has(node.start)) {
        return;
    }
    const callee = unwrapExpression(node.callee);
    if (
        !callee ||
        (callee.type !== "Identifier" && callee.type !== "IdentifierReference")
    ) {
        return;
    }
    const parameterFlow = directParameterReference(callee);
    if (!parameterFlow) return;
    reportedStarts.add(node.start);
    addFinding(
        "callback-parameter-call",
        "warning",
        `Parameter ${nodeName(callee)} is invoked as a callback, so function identity diversity is an observable call-site input.`,
        "Train stable, polymorphic, and megamorphic callback families in both warmup and guarded stress.",
        node,
        parameterFlow
    );
};

/** Find a proven callback passed to a known callback-consuming method. */
export const detectCallbackFlow = (
    node: AstNode,
    directParameterReference: ResolveParameterFlow,
    reportedStarts: Set<number>,
    addFinding: AddFinding
) => {
    if (
        node.type !== "CallExpression" ||
        reportedStarts.has(node.start) ||
        !isNode(node.callee) ||
        node.callee.type !== "MemberExpression" ||
        !callbackConsumingMethods.has(memberPropertyName(node.callee) ?? "") ||
        !Array.isArray(node.arguments)
    ) {
        return;
    }
    for (const argument of node.arguments) {
        if (!isNode(argument)) continue;
        const parameterFlow = directParameterReference(argument);
        if (!parameterFlow) continue;
        reportedStarts.add(node.start);
        addFinding(
            "callback-parameter-flow",
            "warning",
            `Parameter ${nodeName(argument)} flows into ${memberPropertyName(node.callee)} as a callback identity input.`,
            "Train stable, polymorphic, and megamorphic callback families after a stable warmup.",
            node,
            parameterFlow
        );
        return;
    }
};
