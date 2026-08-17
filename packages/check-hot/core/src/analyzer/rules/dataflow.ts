import { isNode, nodeName, walk } from "../ast.js";
import type { AstNode } from "../ast.js";
import type { ParameterFlow } from "../internal-model.js";
import { functionTypes } from "./syntax.js";

export const collectDeclaredNames = (root: AstNode) => {
    const names = new Set<string>();
    walk(root, [], node => {
        if (node !== root && functionTypes.has(node.type)) {
            const declarationName = nodeName(node.id);
            if (declarationName) names.add(declarationName);
            return false;
        }
        if (node === root && Array.isArray(node.params)) {
            for (const parameter of node.params) {
                addPatternNames(parameter, names);
            }
        }
        if (
            node.type === "VariableDeclarator" ||
            node.type === "FunctionDeclaration" ||
            node.type === "ClassDeclaration"
        ) {
            addPatternNames(node.id, names);
        }
        if (
            node.type === "ImportSpecifier" ||
            node.type === "ImportDefaultSpecifier" ||
            node.type === "ImportNamespaceSpecifier"
        ) {
            const name = nodeName(node.local);
            if (name) names.add(name);
        }
    });
    return names;
};

export const addPatternNames = (value: unknown, names: Set<string>) => {
    if (!isNode(value)) return;
    const direct = nodeName(value);
    if (
        direct &&
        (value.type === "Identifier" || value.type === "BindingIdentifier")
    ) {
        names.add(direct);
        return;
    }
    if (value.type === "RestElement") {
        addPatternNames(value.argument, names);
        return;
    }
    if (value.type === "AssignmentPattern") {
        addPatternNames(value.left, names);
        return;
    }
    if (value.type === "ArrayPattern" && Array.isArray(value.elements)) {
        for (const element of value.elements) addPatternNames(element, names);
        return;
    }
    if (value.type === "ObjectPattern" && Array.isArray(value.properties)) {
        for (const property of value.properties) {
            if (!isNode(property)) continue;
            addPatternNames(
                property.type === "Property"
                    ? property.value
                    : property.argument,
                names
            );
        }
    }
};

/**
 * Visit identifier bindings written by an assignment target without treating
 * member properties or object-pattern keys as reassigned lexical bindings.
 */
export const visitAssignedBindings = (
    value: unknown,
    visit: (binding: AstNode) => void
) => {
    if (!isNode(value)) return;
    if (
        value.type === "Identifier" ||
        value.type === "IdentifierReference" ||
        value.type === "BindingIdentifier"
    ) {
        visit(value);
        return;
    }
    if (value.type === "RestElement" || value.type === "SpreadElement") {
        visitAssignedBindings(value.argument, visit);
        return;
    }
    if (value.type === "AssignmentPattern") {
        visitAssignedBindings(value.left, visit);
        return;
    }
    if (
        (value.type === "ArrayPattern" ||
            value.type === "ArrayAssignmentTarget") &&
        Array.isArray(value.elements)
    ) {
        for (const element of value.elements) {
            visitAssignedBindings(element, visit);
        }
        return;
    }
    if (
        (value.type === "ObjectPattern" ||
            value.type === "ObjectAssignmentTarget") &&
        Array.isArray(value.properties)
    ) {
        for (const property of value.properties) {
            if (!isNode(property)) continue;
            if (property.type === "Property") {
                visitAssignedBindings(property.value, visit);
            } else {
                visitAssignedBindings(property.argument, visit);
            }
        }
        return;
    }
    if (
        value.type === "TSAsExpression" ||
        value.type === "TSSatisfiesExpression" ||
        value.type === "TSNonNullExpression" ||
        value.type === "TypeCastExpression" ||
        value.type === "ParenthesizedExpression"
    ) {
        visitAssignedBindings(value.expression, visit);
    }
};

export const addPatternBindings = (
    value: unknown,
    index: number,
    path: readonly (string | number)[],
    bindings: ParameterFlow[]
) => {
    if (!isNode(value)) return;
    const direct = nodeName(value);
    if (
        direct &&
        (value.type === "Identifier" || value.type === "BindingIdentifier")
    ) {
        bindings.push({ name: direct, index, path });
        return;
    }
    if (value.type === "AssignmentPattern") {
        addPatternBindings(value.left, index, path, bindings);
        return;
    }
    if (value.type === "RestElement") {
        const restBindings: ParameterFlow[] = [];
        addPatternBindings(value.argument, index, path, restBindings);
        bindings.push(
            ...restBindings.map(binding =>
                Object.assign({}, binding, { automatable: false })
            )
        );
        return;
    }
    if (value.type === "ArrayPattern" && Array.isArray(value.elements)) {
        for (const [elementIndex, element] of value.elements.entries()) {
            addPatternBindings(
                element,
                index,
                [...path, elementIndex],
                bindings
            );
        }
        return;
    }
    if (value.type === "ObjectPattern" && Array.isArray(value.properties)) {
        for (const property of value.properties) {
            if (!isNode(property)) continue;
            if (property.type !== "Property") {
                addPatternBindings(property, index, path, bindings);
                continue;
            }
            const keyNode = isNode(property.key) ? property.key : undefined;
            const computedLiteral =
                property.computed === true &&
                keyNode?.type === "Literal" &&
                (typeof keyNode.value === "string" ||
                    typeof keyNode.value === "number")
                    ? keyNode.value
                    : undefined;
            const key =
                property.computed === true
                    ? computedLiteral
                    : nodeName(property.key);
            if (key !== undefined) {
                addPatternBindings(
                    property.value,
                    index,
                    [...path, key],
                    bindings
                );
            } else {
                const dynamicBindings: ParameterFlow[] = [];
                addPatternBindings(
                    property.value,
                    index,
                    path,
                    dynamicBindings
                );
                for (const binding of dynamicBindings) {
                    binding.automatable = false;
                    bindings.push(binding);
                }
            }
        }
    }
};

export const directLexicalBindings = (scope: AstNode) => {
    const names = new Set<string>();
    const body =
        scope.type === "SwitchStatement" && Array.isArray(scope.cases)
            ? scope.cases.flatMap(item =>
                  isNode(item) && Array.isArray(item.consequent)
                      ? item.consequent
                      : []
              )
            : Array.isArray(scope.body)
              ? scope.body
              : isNode(scope.body) && Array.isArray(scope.body.body)
                ? scope.body.body
                : [];
    for (const statement of body) {
        if (!isNode(statement)) continue;
        if (
            statement.type === "VariableDeclaration" &&
            statement.kind !== "var" &&
            Array.isArray(statement.declarations)
        ) {
            for (const declaration of statement.declarations) {
                if (isNode(declaration)) addPatternNames(declaration.id, names);
            }
        }
        if (
            statement.type === "FunctionDeclaration" ||
            statement.type === "ClassDeclaration"
        ) {
            addPatternNames(statement.id, names);
        }
    }
    return names;
};

export const functionScopedBindings = (scope: AstNode) => {
    const names = new Set<string>();
    if (Array.isArray(scope.params)) {
        for (const parameter of scope.params) addPatternNames(parameter, names);
    }
    if (scope.type === "FunctionExpression") addPatternNames(scope.id, names);
    walk(scope, [], node => {
        if (node !== scope && functionTypes.has(node.type)) return false;
        if (
            node.type === "VariableDeclaration" &&
            node.kind === "var" &&
            Array.isArray(node.declarations)
        ) {
            for (const declaration of node.declarations) {
                if (isNode(declaration)) addPatternNames(declaration.id, names);
            }
        }
    });
    return names;
};

export const isIdentifierReference = (
    node: AstNode,
    ancestors: readonly AstNode[]
) => {
    if (node.type !== "Identifier" && node.type !== "IdentifierReference") {
        return false;
    }
    const parent = ancestors.at(-1);
    if (!parent) return true;
    if (
        (parent.type === "MemberExpression" &&
            parent.property === node &&
            parent.computed !== true) ||
        (parent.type === "Property" &&
            parent.key === node &&
            parent.computed !== true &&
            parent.shorthand !== true) ||
        (parent.type === "MethodDefinition" && parent.key === node) ||
        ((parent.type === "VariableDeclarator" ||
            parent.type === "FunctionDeclaration" ||
            parent.type === "FunctionExpression" ||
            parent.type === "ClassDeclaration" ||
            parent.type === "ClassExpression") &&
            parent.id === node) ||
        (functionTypes.has(parent.type) &&
            Array.isArray(parent.params) &&
            parent.params.includes(node)) ||
        (parent.type === "CatchClause" && parent.param === node) ||
        (parent.type === "AssignmentExpression" && parent.left === node) ||
        (parent.type === "UpdateExpression" && parent.argument === node) ||
        parent.type.startsWith("Import") ||
        parent.type.startsWith("Export")
    ) {
        return false;
    }
    return true;
};

export const reachesFunctionParameter = (
    candidate: AstNode,
    parameterName: string,
    node: AstNode,
    ancestors: readonly AstNode[]
) => {
    if (!isIdentifierReference(node, ancestors)) return false;
    return !isNameShadowedBetween(candidate, parameterName, ancestors);
};

export const isNameShadowedBetween = (
    root: AstNode,
    name: string,
    ancestors: readonly AstNode[]
) => {
    for (let index = ancestors.length - 1; index >= 0; index--) {
        const scope = ancestors[index];
        if (scope === root) break;
        if (
            functionTypes.has(scope.type) &&
            functionScopedBindings(scope).has(name)
        ) {
            return true;
        }
        if (
            (scope.type === "BlockStatement" ||
                scope.type === "StaticBlock" ||
                scope.type === "SwitchStatement") &&
            directLexicalBindings(scope).has(name)
        ) {
            return true;
        }
        if (scope.type === "CatchClause") {
            const names = new Set<string>();
            addPatternNames(scope.param, names);
            if (names.has(name)) return true;
        }
        if (
            scope.type === "ForStatement" ||
            scope.type === "ForInStatement" ||
            scope.type === "ForOfStatement"
        ) {
            const declaration =
                scope.type === "ForStatement" ? scope.init : scope.left;
            if (
                isNode(declaration) &&
                declaration.type === "VariableDeclaration" &&
                declaration.kind !== "var" &&
                Array.isArray(declaration.declarations)
            ) {
                const names = new Set<string>();
                for (const item of declaration.declarations) {
                    if (isNode(item)) addPatternNames(item.id, names);
                }
                if (names.has(name)) return true;
            }
        }
    }
    return false;
};

export const isUnboundGlobalReference = (
    program: AstNode,
    name: string,
    node: AstNode,
    ancestors: readonly AstNode[]
) =>
    isIdentifierReference(node, ancestors) &&
    !isNameShadowedBetween(program, name, ancestors) &&
    !functionScopedBindings(program).has(name) &&
    !directLexicalBindings(program).has(name);
