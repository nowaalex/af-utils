import { isNode } from "../../ast.js";
import type { AstNode } from "../../ast.js";

/** Syntax families whose V8 code-creation coordinates have real-engine controls. */
export type V8CodeCreationSyntaxKind =
    | "FunctionDeclaration"
    | "FunctionExpression"
    | "ArrowFunctionExpression"
    | "ObjectMethod"
    | "ObjectGetter"
    | "ObjectSetter"
    | "ClassMethod"
    | "ClassGetter"
    | "ClassSetter";

/** Source-offset form retained internally until the analyzer locates its line. */
export interface V8CodeCreationAnchor {
    offset: number;
    anchor: "parameter-list-start" | "parameter-start" | "async-keyword-start";
    syntaxKind: V8CodeCreationSyntaxKind;
    async: boolean;
    generator: boolean;
    static: boolean;
    computed: boolean;
}

const syntaxKindOf = (
    node: AstNode,
    parent?: AstNode
): V8CodeCreationSyntaxKind | undefined => {
    if (parent?.type === "MethodDefinition") {
        if (
            parent.kind === "constructor" ||
            (isNode(parent.key) && parent.key.type === "PrivateIdentifier")
        ) {
            return;
        }
        return parent.kind === "get"
            ? "ClassGetter"
            : parent.kind === "set"
              ? "ClassSetter"
              : "ClassMethod";
    }
    if (parent?.type === "Property" && parent.value === node) {
        if (parent.kind === "get") return "ObjectGetter";
        if (parent.kind === "set") return "ObjectSetter";
        if (parent.method === true) return "ObjectMethod";
    }
    switch (node.type) {
        case "FunctionDeclaration":
        case "FunctionExpression":
        case "ArrowFunctionExpression":
            return node.type;
    }
};

/**
 * Derive the exact source anchor emitted by supported V8 code-creation logs.
 *
 * The function-node start is deliberately not used: V8 reports the opening
 * parameter parenthesis, or the first parameter for a bare single-parameter
 * arrow. Unknown syntax stays unavailable instead of widening attribution.
 */
export const deriveV8CodeCreationAnchor = (
    source: string,
    node: AstNode,
    parent?: AstNode
): V8CodeCreationAnchor | undefined => {
    const syntaxKind = syntaxKindOf(node, parent);
    if (!syntaxKind || !isNode(node.body) || !Array.isArray(node.params))
        return;
    if (syntaxKind === "ArrowFunctionExpression") {
        if (node.async === true) {
            if (source.slice(node.start, node.start + 5) !== "async") return;
            return {
                offset: node.start,
                anchor: "async-keyword-start",
                syntaxKind,
                async: true,
                generator: false,
                static: false,
                computed: false
            };
        }
    }
    const firstParameter = node.params.find(isNode);
    const parameterBoundary = firstParameter?.start ?? node.body.start;
    if (parameterBoundary > node.body.start) return;
    if (node.body.start > source.length) return;
    const parameterPrefix = source.slice(node.start, parameterBoundary);
    const parenthesis = parameterPrefix.lastIndexOf("(");
    if (parenthesis >= 0) {
        let staticMethod = false;
        let computed = false;
        if (parent?.type === "MethodDefinition") {
            staticMethod = parent.static === true;
            computed = parent.computed === true;
        } else if (parent?.type === "Property") {
            computed = parent.computed === true;
        }
        return {
            offset: node.start + parenthesis,
            anchor: "parameter-list-start",
            syntaxKind,
            async: node.async === true,
            generator: node.generator === true,
            static: staticMethod,
            computed
        };
    }
    if (syntaxKind !== "ArrowFunctionExpression") return;
    if (firstParameter?.type !== "Identifier") return;
    if (firstParameter.start !== node.start) return;
    return {
        offset: firstParameter.start,
        anchor: "parameter-start",
        syntaxKind,
        async: false,
        generator: false,
        static: false,
        computed: false
    };
};
