import { isNode, nodeName } from "../../ast.js";
import type { AstNode } from "../../ast.js";
import { memberPropertyName } from "../syntax.js";
import { defineAnalyzerProblems } from "../shared.js";
import type { AddFinding } from "../shared.js";

const deletionGuidance = {
    likelyCauses: [
        "Deleting an indexed element creates a hole, while deleting a named field can invalidate stable object-map assumptions."
    ],
    confirmWith: [
        "Inspect array elements kinds or object maps before and after the deletion in an isolated scenario."
    ],
    remediations: [
        {
            action: "Use a stable sentinel field value or an explicit packed-array removal operation.",
            when: "The alternative preserves absence semantics and engine evidence confirms the deletion destabilizes the path."
        }
    ]
} as const;

/** Rules implemented by this feature. */
export const ruleDefinitions = defineAnalyzerProblems("property-deletion", [
    {
        id: "delete-property",
        title: "Object property deletion",
        mutationFamily: "object-shape",
        runtimeExperiment: false,
        ...deletionGuidance
    },
    {
        id: "holey-array-operation",
        title: "Array hole created by delete",
        mutationFamily: "array-elements",
        runtimeExperiment: false,
        ...deletionGuidance
    }
] as const);

/** Distinguish an array hole from a general object-shape deletion. */
export const detectPropertyDeletion = (
    node: AstNode,
    knownArrays: ReadonlySet<string>,
    addFinding: AddFinding
) => {
    if (node.type !== "UnaryExpression" || node.operator !== "delete") return;
    const argument = node.argument;
    const arrayDelete =
        isNode(argument) &&
        argument.type === "MemberExpression" &&
        knownArrays.has(nodeName(argument.object) ?? "") &&
        memberPropertyName(argument) !== undefined;
    addFinding(
        arrayDelete ? "holey-array-operation" : "delete-property",
        "critical",
        arrayDelete
            ? "Deleting an index from a locally created array makes its elements holey."
            : "Deleting an object property can move objects to dictionary storage and invalidate optimized shape assumptions.",
        arrayDelete
            ? "Keep packed and holey behavior in separate scenarios and verify the array elements kind dynamically."
            : "Prefer stable object shapes (for example assign undefined) when this object participates in a hot path, and verify maps dynamically.",
        node
    );
};
