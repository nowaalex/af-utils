import { isNode } from "../../ast.js";
import type { AstNode } from "../../ast.js";
import { memberPropertyName } from "../syntax.js";
import type { AddFinding, ResolveParameterFlow } from "../shared.js";
import { defineAnalyzerProblems } from "../shared.js";

const receiverGuidance = {
    likelyCauses: [
        "A receiver parameter may arrive with different array representations or object maps."
    ],
    confirmWith: [
        "Exercise representation-specific receiver variants and require exact-site plus engine evidence."
    ],
    remediations: [
        {
            action: "Normalize receiver construction or split genuinely distinct receiver families.",
            when: "The measured access site becomes unstable for supported API inputs."
        }
    ]
} as const;

/** Rules implemented by this feature. */
export const ruleDefinitions = defineAnalyzerProblems("parameter-receiver", [
    {
        id: "parameter-indexed-access",
        title: "Indexed parameter receiver",
        mutationFamily: "array-elements",
        runtimeExperiment: true,
        ...receiverGuidance
    },
    {
        id: "parameter-property-access",
        title: "Named-property parameter receiver",
        mutationFamily: "object-shape",
        runtimeExperiment: true,
        ...receiverGuidance
    },
    {
        id: "ambiguous-length-access",
        title: "Ambiguous parameter .length receiver",
        mutationFamily: "array-elements",
        runtimeExperiment: false,
        ...receiverGuidance
    },
    {
        id: "ambiguous-keyed-receiver",
        title: "Ambiguous dynamically keyed receiver",
        mutationFamily: "property-key",
        runtimeExperiment: false,
        ...receiverGuidance
    }
] as const);

const arrayLikeProperties = new Set([
    "at",
    "concat",
    "entries",
    "every",
    "filter",
    "find",
    "findIndex",
    "flat",
    "flatMap",
    "forEach",
    "includes",
    "indexOf",
    "join",
    "keys",
    "map",
    "pop",
    "push",
    "reduce",
    "reduceRight",
    "reverse",
    "shift",
    "slice",
    "some",
    "sort",
    "splice",
    "unshift",
    "values"
]);

/** Classify proven parameter receivers without treating arbitrary brackets as arrays. */
export const detectParameterReceiver = (
    node: AstNode,
    directParameterReference: ResolveParameterFlow,
    addFinding: AddFinding
) => {
    if (node.type !== "MemberExpression" || !isNode(node.object)) return;
    const parameterFlow = directParameterReference(node.object);
    if (!parameterFlow) return;
    const property = memberPropertyName(node);
    if (node.computed === true && property === undefined) {
        addFinding(
            "ambiguous-keyed-receiver",
            "info",
            "A function parameter is used as a dynamically keyed receiver, but the access does not prove whether it is an array, string, object, or collection-like value.",
            "Keep this as advisory evidence until the receiver or key has a separately proven mutation role.",
            node
        );
        return;
    }
    if (property === "length" && node.computed !== true) {
        addFinding(
            "ambiguous-length-access",
            "info",
            "A function parameter is read through .length, but this access alone does not prove whether the receiver is an array, string, or ordinary object.",
            "Keep this as advisory evidence until another operation proves a safe receiver-specific mutation plan.",
            node
        );
        return;
    }
    const arrayLike =
        (node.computed === true &&
            isNode(node.property) &&
            node.property.type === "Literal" &&
            typeof node.property.value === "number") ||
        (property !== undefined &&
            node.computed !== true &&
            arrayLikeProperties.has(property));
    addFinding(
        arrayLike ? "parameter-indexed-access" : "parameter-property-access",
        "warning",
        arrayLike
            ? "A function parameter is used as an indexed/array-like receiver, so elements kind and packedness are hot-path inputs."
            : "A function parameter is used as a named-property receiver, so hidden-class and missing-field diversity are hot-path inputs.",
        arrayLike
            ? "Exercise packed SMI, double, object, holey, and dictionary arrays after a stable warmup."
            : "Exercise stable, reordered, extra, and missing-field shapes after a stable warmup.",
        node,
        parameterFlow
    );
};
