import { isNode, nodeName } from "../ast.js";
import type { AstNode } from "../ast.js";

export const functionTypes = new Set([
    "ArrowFunctionExpression",
    "FunctionDeclaration",
    "FunctionExpression"
]);

export const expressionKind = (node: unknown) => {
    if (!isNode(node)) return "empty";
    if (node.type === "Literal")
        return node.value === null ? "null" : typeof node.value;
    if (
        node.type === "UnaryExpression" &&
        (node.operator === "+" || node.operator === "-") &&
        isNode(node.argument) &&
        node.argument.type === "Literal" &&
        typeof node.argument.value === "number"
    ) {
        return "number";
    }
    if (node.type === "ObjectExpression") return "object";
    if (node.type === "ArrayExpression") return "array";
    if (
        node.type === "FunctionExpression" ||
        node.type === "ArrowFunctionExpression"
    ) {
        return "function";
    }
    if (node.type === "NewExpression")
        return `new:${nodeName(node.callee) ?? "unknown"}`;
    return node.type;
};

export const memberLabel = (node: unknown) => {
    if (!isNode(node) || node.type !== "MemberExpression") return;
    const object = nodeName(node.object);
    const property = nodeName(node.property);
    return object && property ? `${object}.${property}` : undefined;
};

export const memberPropertyName = (node: unknown) => {
    if (!isNode(node) || node.type !== "MemberExpression") return;
    if (node.computed === true) {
        const property = node.property;
        return isNode(property) &&
            property.type === "Literal" &&
            (typeof property.value === "string" ||
                typeof property.value === "number")
            ? String(property.value)
            : undefined;
    }
    return nodeName(node.property);
};

export const unwrapExpression = (value: unknown): AstNode | undefined => {
    let node = isNode(value) ? value : undefined;
    while (
        node &&
        (node.type === "ParenthesizedExpression" ||
            node.type === "TSAsExpression" ||
            node.type === "TSSatisfiesExpression" ||
            node.type === "TSNonNullExpression") &&
        isNode(node.expression)
    ) {
        node = node.expression;
    }
    return node;
};
