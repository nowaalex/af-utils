import { isNode } from "../../ast.js";
import type { AstNode } from "../../ast.js";
import type { AddFinding, ResolveParameterFlow } from "../shared.js";
import { defineAnalyzerProblems } from "../shared.js";

const numericGuidance = {
    likelyCauses: [
        "A numeric operation observes values that move between SMI, heap-number, boundary, or exceptional numeric representations."
    ],
    confirmWith: [
        "Exercise SMI, fractional, -0, NaN, integer boundaries, and overflow variants with semantic verification."
    ],
    remediations: [
        {
            action: "Normalize the accepted numeric domain or warm every intentional representation.",
            when: "Engine evidence confirms a harmful representation transition and normalization preserves the API contract."
        }
    ]
} as const;

/** Rules implemented by this feature. */
export const ruleDefinitions = defineAnalyzerProblems(
    "numeric-representation",
    [
        {
            id: "numeric-operation",
            title: "Numeric representation transition",
            mutationFamily: "numeric-representation",
            runtimeExperiment: true,
            ...numericGuidance
        }
    ] as const
);

const binaryNumericOperators = new Set([
    "+",
    "-",
    "*",
    "/",
    "%",
    "**",
    "<<",
    ">>",
    ">>>",
    "&",
    "|",
    "^"
]);
const unaryNumericOperators = new Set(["+", "-", "~"]);
const assignmentNumericOperators = new Set(
    [...binaryNumericOperators].map(operator => `${operator}=`)
);
const updateNumericOperators = new Set(["++", "--"]);

const isStaticallyStringLike = (value: unknown): boolean => {
    if (!isNode(value)) return false;
    if (
        value.type === "StringLiteral" ||
        value.type === "TemplateLiteral" ||
        (value.type === "Literal" && typeof value.value === "string")
    ) {
        return true;
    }
    return (
        value.type === "BinaryExpression" &&
        value.operator === "+" &&
        (isStaticallyStringLike(value.left) ||
            isStaticallyStringLike(value.right))
    );
};

const isNumericOperatorNode = (node: AstNode) => {
    const operator = String(node.operator);
    if (node.type === "BinaryExpression") {
        return binaryNumericOperators.has(operator);
    }
    if (node.type === "UnaryExpression") {
        return unaryNumericOperators.has(operator);
    }
    if (node.type === "AssignmentExpression") {
        return assignmentNumericOperators.has(operator);
    }
    return (
        node.type === "UpdateExpression" && updateNumericOperators.has(operator)
    );
};

const isProvenStringConcatenation = (node: AstNode) =>
    (node.type === "BinaryExpression" && node.operator === "+") ||
    (node.type === "AssignmentExpression" && node.operator === "+=")
        ? isStaticallyStringLike(node.left) ||
          isStaticallyStringLike(node.right)
        : false;

/** Find an arithmetic site reached by a proven public argument. */
export const detectNumericRepresentation = (
    node: AstNode,
    numericParameterIn: ResolveParameterFlow,
    addFinding: AddFinding
) => {
    if (!isNumericOperatorNode(node) || isProvenStringConcatenation(node)) {
        return;
    }
    const parameterFlow = numericParameterIn(node);
    if (!parameterFlow) return;
    addFinding(
        "numeric-operation",
        "info",
        "A function parameter reaches a numeric representation-sensitive operation.",
        "Exercise SMI, double, -0, NaN, int32/uint32 boundaries, and overflow where the API accepts them.",
        node,
        parameterFlow
    );
};
