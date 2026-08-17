import { createHash } from "node:crypto";
import { relative, sep } from "node:path";

import { childrenOf, isNode, locate, nodeName, walk } from "../ast.js";
import type { AstNode } from "../ast.js";
import type {
    CandidateNode,
    ParameterFlow,
    ParsedFile
} from "../internal-model.js";
import type {
    HotAnalysisCandidate,
    HotAnalysisFinding,
    HotAnalysisMetrics,
    HotAnalysisSeverity
} from "../model.js";
import { functionTypes, unwrapExpression } from "./syntax.js";
import {
    detectCallbackCall,
    detectCallbackFlow
} from "./callback-identity/detector.js";
import {
    collectKnownArrays,
    detectArrayElements,
    finishArrayElements
} from "./array-elements/detector.js";
import { finishCompilationComplexity } from "./compilation-complexity/detector.js";
import { detectDynamicCode } from "./dynamic-code/detector.js";
import {
    detectLoopPressure,
    finishLoopPressure,
    loopTypes
} from "./loop-pressure/detector.js";
import { detectNumericRepresentation } from "./numeric-representation/detector.js";
import { detectParameterReceiver } from "./parameter-receiver/detector.js";
import { detectPropertyDeletion } from "./property-deletion/detector.js";
import { detectPropertyKey } from "./property-key/detector.js";
import {
    detectReturnRepresentation,
    finishReturnRepresentation
} from "./return-representation/detector.js";
import {
    detectShapeMutation,
    initializedClassProperties
} from "./shape-mutation/detector.js";
import type { AddFinding } from "./shared.js";
import {
    addPatternBindings,
    collectDeclaredNames,
    isIdentifierReference,
    isNameShadowedBetween,
    reachesFunctionParameter
} from "./dataflow.js";
import {
    collectParameterInvalidations,
    findAliasInvalidation
} from "./dataflow/binding-writes.js";

export {
    functionTypes,
    memberPropertyName,
    unwrapExpression
} from "./syntax.js";
export { addPatternBindings, isUnboundGlobalReference } from "./dataflow.js";

export const severityWeight: Record<HotAnalysisSeverity, number> = {
    info: 1,
    warning: 2,
    critical: 3
};

const isReadModifyWriteTarget = (
    node: AstNode,
    ancestors: readonly AstNode[]
) => {
    const parent = ancestors.at(-1);
    return (
        (parent?.type === "AssignmentExpression" &&
            parent.operator !== "=" &&
            parent.left === node) ||
        (parent?.type === "UpdateExpression" && parent.argument === node)
    );
};

export const analyzeCandidate = (
    candidate: CandidateNode,
    parsed: ParsedFile,
    lineStarts: readonly number[],
    packageRoot: string,
    fileDeclaredNames: ReadonlySet<string>,
    initializedPropertiesByClass: Map<AstNode, ReadonlySet<string>>
) => {
    const declarationLocation = locate(lineStarts, candidate.node.start);
    const declarationEndLocation = locate(lineStarts, candidate.node.end);
    const relativeFile = relative(packageRoot, parsed.file)
        .split(sep)
        .join("/");
    const logicalName =
        candidate.annotation ??
        (candidate.className
            ? `${candidate.className}.${candidate.name}`
            : candidate.name);
    const id = `${relativeFile}#${logicalName}@${declarationLocation.line}:${candidate.node.start}`;
    const findings: HotAnalysisFinding[] = [];
    const addFinding: AddFinding = (
        rule: string,
        severity: HotAnalysisSeverity,
        message: string,
        suggestion: string,
        node: AstNode,
        parameterFlow?: ParameterFlow
    ) => {
        const location = locate(lineStarts, node.start);
        const endLocation = locate(lineStarts, node.end);
        const sourceLines = parsed.source
            .split(/\r?\n/u)
            .slice(location.line - 1, endLocation.line);
        findings.push({
            rule,
            severity,
            message,
            suggestion,
            file: parsed.file,
            ...location,
            endLine: endLocation.line,
            endColumn: endLocation.column,
            start: node.start,
            end: node.end,
            sourceLine: sourceLines[0] ?? "",
            sourceLines,
            functionId: id,
            ...(parameterFlow && parameterFlow.automatable !== false
                ? {
                      parameterIndex: parameterFlow.index,
                      parameterPath: parameterFlow.path
                  }
                : {})
        });
    };
    const metrics: HotAnalysisMetrics = {
        lines:
            locate(lineStarts, candidate.node.end).line -
            locate(lineStarts, candidate.node.start).line +
            1,
        branches: 0,
        loops: 0,
        calls: 0,
        allocationsInLoops: 0,
        dynamicKeyedAccesses: 0
    };
    const returnKinds = new Set<string>();
    const arrayElementsState = {
        pushKinds: new Map<string, { kinds: Set<string>; node: AstNode }>()
    };
    const declaredNames = new Set([
        ...fileDeclaredNames,
        ...collectDeclaredNames(candidate.node)
    ]);
    for (const parameter of candidate.parameterNames) {
        declaredNames.add(parameter);
    }
    let initializedProperties = candidate.classNode
        ? initializedPropertiesByClass.get(candidate.classNode)
        : undefined;
    if (!initializedProperties) {
        initializedProperties = initializedClassProperties(candidate.classNode);
        if (candidate.classNode) {
            initializedPropertiesByClass.set(
                candidate.classNode,
                initializedProperties
            );
        }
    }
    const parameterReferences = new Map<number, ParameterFlow>();
    const { writeStarts: parameterWrites, dynamicScopeHazard } =
        collectParameterInvalidations(candidate);
    walk(candidate.node, [], (node, ancestors) => {
        if (node !== candidate.node && functionTypes.has(node.type))
            return false;
        const name = nodeName(node);
        const binding = candidate.parameterBindings.find(
            item => item.name === name
        );
        if (
            binding &&
            name &&
            !dynamicScopeHazard &&
            !(parameterWrites.get(name) ?? []).some(
                writeStart => writeStart < node.start
            ) &&
            (reachesFunctionParameter(candidate.node, name, node, ancestors) ||
                (isReadModifyWriteTarget(node, ancestors) &&
                    !isNameShadowedBetween(candidate.node, name, ancestors)))
        ) {
            parameterReferences.set(node.start, binding);
        }
    });
    const directParameterReference = (value: unknown) => {
        const node = unwrapExpression(value);
        if (
            !node ||
            (node.type !== "Identifier" && node.type !== "IdentifierReference")
        ) {
            return;
        }
        return parameterReferences.get(node.start);
    };
    const aliasBindings: {
        name: string;
        parameterFlow: ParameterFlow;
        scope: AstNode;
        declarationEnd: number;
        invalidatedAt?: number;
    }[] = [];
    let flowChanged = true;
    while (flowChanged) {
        const previousReferences = parameterReferences.size;
        const previousBindings = aliasBindings.length;
        walk(candidate.node, [], (node, ancestors) => {
            if (node !== candidate.node && functionTypes.has(node.type))
                return false;
            if (
                node.type !== "VariableDeclarator" ||
                !isNode(node.id) ||
                !isNode(node.init)
            ) {
                return;
            }
            const parameterFlow = directParameterReference(node.init);
            const scope = [...ancestors]
                .toReversed()
                .find(
                    ancestor =>
                        ancestor.type === "BlockStatement" ||
                        ancestor.type === "SwitchStatement" ||
                        ancestor.type === "ForStatement" ||
                        ancestor.type === "ForInStatement" ||
                        ancestor.type === "ForOfStatement" ||
                        functionTypes.has(ancestor.type)
                );
            if (parameterFlow === undefined || !scope) {
                return;
            }
            const discovered: ParameterFlow[] = [];
            addPatternBindings(
                node.id,
                parameterFlow.index,
                parameterFlow.path,
                discovered
            );
            for (const flow of discovered) {
                if (
                    aliasBindings.some(
                        binding =>
                            binding.name === flow.name &&
                            binding.scope === scope
                    )
                ) {
                    continue;
                }
                aliasBindings.push({
                    name: flow.name,
                    parameterFlow: {
                        ...flow,
                        automatable:
                            flow.automatable === false ||
                            parameterFlow.automatable === false
                                ? false
                                : undefined
                    },
                    scope,
                    declarationEnd: node.end
                });
            }
        });
        for (const binding of aliasBindings) {
            if (binding.invalidatedAt !== undefined) continue;
            if (dynamicScopeHazard) {
                binding.invalidatedAt = binding.declarationEnd;
                continue;
            }
            binding.invalidatedAt = findAliasInvalidation(candidate, binding);
        }
        walk(candidate.node, [], (node, ancestors) => {
            if (node !== candidate.node && functionTypes.has(node.type))
                return false;
            const name = nodeName(node);
            if (
                !name ||
                (!isIdentifierReference(node, ancestors) &&
                    !isReadModifyWriteTarget(node, ancestors))
            ) {
                return;
            }
            const binding = aliasBindings
                .filter(
                    candidateBinding =>
                        candidateBinding.name === name &&
                        ancestors.includes(candidateBinding.scope) &&
                        node.start >= candidateBinding.declarationEnd &&
                        (candidateBinding.invalidatedAt === undefined ||
                            node.start < candidateBinding.invalidatedAt ||
                            (node.start === candidateBinding.invalidatedAt &&
                                isReadModifyWriteTarget(node, ancestors)))
                )
                .toSorted(
                    (left, right) =>
                        ancestors.lastIndexOf(right.scope) -
                        ancestors.lastIndexOf(left.scope)
                )[0];
            if (!binding) return;
            if (!isNameShadowedBetween(binding.scope, name, ancestors)) {
                parameterReferences.set(node.start, binding.parameterFlow);
            }
        });
        flowChanged =
            previousReferences !== parameterReferences.size ||
            previousBindings !== aliasBindings.length;
    }
    const numericParameterIn = (value: unknown): ParameterFlow | undefined => {
        const node = unwrapExpression(value);
        if (!node) return;
        if (node.type === "Identifier" || node.type === "IdentifierReference") {
            return directParameterReference(node);
        }
        if (node.type === "UnaryExpression") {
            return numericParameterIn(node.argument);
        }
        if (node.type === "BinaryExpression") {
            return (
                numericParameterIn(node.left) ?? numericParameterIn(node.right)
            );
        }
        if (node.type === "AssignmentExpression") {
            return (
                numericParameterIn(node.left) ?? numericParameterIn(node.right)
            );
        }
        if (node.type === "UpdateExpression") {
            return numericParameterIn(node.argument);
        }
    };
    const knownArrays = collectKnownArrays(candidate);
    const callbackFindingStarts = new Set<number>();

    const visitBody = (node: AstNode, loopDepth: number) => {
        if (node !== candidate.node && functionTypes.has(node.type)) {
            // The closure expression allocates in the owning function even
            // though its body belongs to a different data-flow/CFG owner.
            detectLoopPressure(node, loopDepth > 0, metrics, addFinding);
            return;
        }
        const insideLoop = loopDepth > 0;
        const childLoopDepth = loopDepth + (loopTypes.has(node.type) ? 1 : 0);
        if (loopTypes.has(node.type)) metrics.loops++;
        if (
            node.type === "IfStatement" ||
            node.type === "ConditionalExpression" ||
            node.type === "LogicalExpression" ||
            node.type === "SwitchCase"
        ) {
            metrics.branches++;
        }
        if (node.type === "CallExpression" || node.type === "NewExpression") {
            metrics.calls++;
        }
        detectParameterReceiver(node, directParameterReference, addFinding);
        detectPropertyKey(
            node,
            insideLoop,
            metrics,
            directParameterReference,
            addFinding
        );
        detectPropertyDeletion(node, knownArrays, addFinding);
        detectArrayElements(
            node,
            parsed,
            knownArrays,
            arrayElementsState,
            addFinding
        );
        if (node.type === "CallExpression") {
            detectCallbackFlow(
                node,
                directParameterReference,
                callbackFindingStarts,
                addFinding
            );
            detectCallbackCall(
                node,
                directParameterReference,
                callbackFindingStarts,
                addFinding
            );
            detectDynamicCode(node, declaredNames, addFinding);
        }
        detectShapeMutation(
            node,
            candidate,
            declaredNames,
            initializedProperties,
            addFinding
        );
        detectNumericRepresentation(node, numericParameterIn, addFinding);
        detectLoopPressure(node, insideLoop, metrics, addFinding);
        detectReturnRepresentation(node, returnKinds);

        for (const child of childrenOf(node)) visitBody(child, childLoopDepth);
    };
    visitBody(candidate.node, 0);

    finishArrayElements(arrayElementsState, addFinding);
    finishReturnRepresentation(candidate.node, returnKinds, addFinding);
    finishLoopPressure(candidate.node, metrics, addFinding);
    finishCompilationComplexity(candidate.node, metrics, addFinding);

    const runtimeSource = parsed.source.slice(
        candidate.runtimeNode.start,
        candidate.runtimeNode.end
    );
    const normalizedRuntimeSource = candidate.stripStaticRuntimePrefix
        ? runtimeSource.replace(/^static\s+/u, "")
        : runtimeSource;
    const completeSourceSha256 = createHash("sha256")
        .update(parsed.source)
        .digest("hex");
    const v8CodeCreation = candidate.v8CodeCreation
        ? {
              schemaVersion: 1 as const,
              sourceSha256: completeSourceSha256,
              ...locate(lineStarts, candidate.v8CodeCreation.offset),
              anchor: candidate.v8CodeCreation.anchor,
              syntaxKind: candidate.v8CodeCreation.syntaxKind,
              async: candidate.v8CodeCreation.async,
              generator: candidate.v8CodeCreation.generator,
              static: candidate.v8CodeCreation.static,
              computed: candidate.v8CodeCreation.computed
          }
        : undefined;

    const reasons: string[] = [];
    let score = 0;
    if (candidate.annotation) {
        score += 100;
        reasons.push("explicit check-hot marker");
    }
    if (candidate.exported) {
        score += 25;
        reasons.push("public/exported API");
    }
    if (metrics.loops > 0) {
        score += Math.min(metrics.loops * 12, 36);
        reasons.push(`${metrics.loops} loop(s)`);
    }
    if (metrics.calls > 0) {
        score += Math.min(metrics.calls, 20);
        reasons.push(`${metrics.calls} call site(s)`);
    }
    if (findings.length > 0) {
        score += findings.reduce(
            (total, finding) => total + severityWeight[finding.severity] * 5,
            0
        );
        reasons.push(`${findings.length} static risk(s)`);
    }
    score += Math.min(Math.floor(metrics.lines / 10), 15);
    return {
        id,
        name: candidate.name,
        kind: candidate.kind,
        className: candidate.className,
        exportName: candidate.exportName,
        targetId: candidate.targetId,
        publicTargets: candidate.publicTargets,
        publicPaths: candidate.publicPaths,
        exported: candidate.exported,
        annotation: candidate.annotation,
        arity: candidate.arity,
        parameterNames: candidate.parameterNames,
        score,
        reasons,
        file: parsed.file,
        start: candidate.node.start,
        end: candidate.node.end,
        sourceSha256: createHash("sha256")
            .update(
                parsed.source.slice(candidate.node.start, candidate.node.end)
            )
            .digest("hex"),
        runtimeSourceSha256: createHash("sha256")
            .update(normalizedRuntimeSource)
            .digest("hex"),
        ...(v8CodeCreation ? { runtimeLocations: { v8CodeCreation } } : {}),
        ...declarationLocation,
        endLine: declarationEndLocation.line,
        endColumn: declarationEndLocation.column,
        metrics,
        findings
    } satisfies HotAnalysisCandidate;
};
