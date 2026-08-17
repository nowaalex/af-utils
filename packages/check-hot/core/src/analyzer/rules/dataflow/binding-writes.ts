import { isNode, nodeName, walk } from "../../ast.js";
import type { AstNode } from "../../ast.js";
import type { CandidateNode } from "../../internal-model.js";
import {
    addPatternNames,
    directLexicalBindings,
    functionScopedBindings,
    isNameShadowedBetween,
    visitAssignedBindings
} from "../dataflow.js";
import { functionTypes } from "../syntax.js";

/** Parameter writes and dynamic-scope constructs that invalidate automation. */
export interface ParameterInvalidations {
    /** Source positions before which a parameter origin remains valid. */
    writeStarts: ReadonlyMap<string, readonly number[]>;
    /** `eval` and `with` prevent a sound static binding proof. */
    dynamicScopeHazard: boolean;
}

/** Identity needed to find writes to one propagated local alias. */
export interface AliasBindingIdentity {
    name: string;
    scope: AstNode;
    declarationEnd: number;
}

const assignmentTargetFor = (node: AstNode): unknown => {
    if (node.type === "VariableDeclarator" && isNode(node.init)) {
        return node.id;
    }
    if (node.type === "AssignmentExpression") return node.left;
    if (node.type === "UpdateExpression") return node.argument;
    if (node.type !== "ForInStatement" && node.type !== "ForOfStatement") {
        return;
    }
    if (!isNode(node.left) || node.left.type !== "VariableDeclaration") {
        return node.left;
    }
    // `var` shares the owning function's binding and therefore writes an
    // existing parameter/alias. `let`/`const` create a loop-local shadow.
    if (node.left.kind !== "var" || !Array.isArray(node.left.declarations)) {
        return;
    }
    const declaration = node.left.declarations[0];
    return isNode(declaration) ? declaration.id : undefined;
};

/**
 * Locate writes to exact public-parameter bindings. A write after an evidence
 * site does not invalidate that earlier read, while a captured closure write is
 * conservative because a hoisted or escaping closure may execute earlier.
 */
export const collectParameterInvalidations = (
    candidate: CandidateNode
): ParameterInvalidations => {
    const writeStarts = new Map<string, number[]>();
    let dynamicScopeHazard = false;
    walk(candidate.node, [], (node, ancestors) => {
        if (
            node.type === "WithStatement" ||
            (node.type === "CallExpression" && nodeName(node.callee) === "eval")
        ) {
            dynamicScopeHazard = true;
        }
        const target = assignmentTargetFor(node);
        if (!isNode(target)) return;
        visitAssignedBindings(target, bindingNode => {
            const name = nodeName(bindingNode);
            if (
                !name ||
                !candidate.parameterBindings.some(item => item.name === name) ||
                isNameShadowedBetween(candidate.node, name, ancestors)
            ) {
                return;
            }
            const capturedByNestedFunction = ancestors.some(
                ancestor =>
                    ancestor !== candidate.node &&
                    functionTypes.has(ancestor.type)
            );
            const starts = writeStarts.get(name) ?? [];
            starts.push(
                capturedByNestedFunction ? candidate.node.start : node.start
            );
            writeStarts.set(name, starts);
        });
    });
    return { writeStarts, dynamicScopeHazard };
};

/** Find the first binding-accurate write that invalidates a local alias. */
export const findAliasInvalidation = (
    candidate: CandidateNode,
    binding: AliasBindingIdentity
) => {
    let invalidatedAt: number | undefined;
    walk(candidate.node, [], (node, ancestors) => {
        const target = assignmentTargetFor(node);
        if (
            !isNode(target) ||
            node.start <= binding.declarationEnd ||
            !ancestors.includes(binding.scope)
        ) {
            return;
        }
        visitAssignedBindings(target, targetBinding => {
            if (nodeName(targetBinding) !== binding.name) return;
            for (let index = ancestors.length - 1; index >= 0; index--) {
                const scope = ancestors[index];
                if (scope === binding.scope) {
                    const capturedByNestedFunction = ancestors
                        .slice(index + 1)
                        .some(ancestor => functionTypes.has(ancestor.type));
                    invalidatedAt = Math.min(
                        invalidatedAt ?? Number.POSITIVE_INFINITY,
                        capturedByNestedFunction
                            ? binding.declarationEnd
                            : node.start
                    );
                    break;
                }
                if (
                    (functionTypes.has(scope.type) &&
                        functionScopedBindings(scope).has(binding.name)) ||
                    ((scope.type === "BlockStatement" ||
                        scope.type === "StaticBlock" ||
                        scope.type === "SwitchStatement") &&
                        directLexicalBindings(scope).has(binding.name)) ||
                    ((scope.type === "ForStatement" ||
                        scope.type === "ForInStatement" ||
                        scope.type === "ForOfStatement") &&
                        loopDeclarationNames(scope).has(binding.name)) ||
                    (scope.type === "CatchClause" &&
                        catchParameterNames(scope).has(binding.name))
                ) {
                    break;
                }
            }
        });
    });
    return invalidatedAt;
};

const loopDeclarationNames = (scope: AstNode) => {
    const names = new Set<string>();
    const declaration = scope.type === "ForStatement" ? scope.init : scope.left;
    if (
        isNode(declaration) &&
        declaration.type === "VariableDeclaration" &&
        declaration.kind !== "var" &&
        Array.isArray(declaration.declarations)
    ) {
        for (const item of declaration.declarations) {
            if (isNode(item)) addPatternNames(item.id, names);
        }
    }
    return names;
};

const catchParameterNames = (scope: AstNode) => {
    const names = new Set<string>();
    addPatternNames(scope.param, names);
    return names;
};
