import type { StaticExportEntry } from "oxc-parser";

import { isNode, nodeName, walk } from "./ast.js";
import type { AstNode } from "./ast.js";
import {
    annotationDeclarationStart,
    bindHotMarkerComments,
    hotMarkerFromComment
} from "./annotation-binding.js";
import { moduleDependencyKey } from "./internal-model.js";
import type {
    CandidateNode,
    ParameterFlow,
    ParsedFile
} from "./internal-model.js";
import type { AnalysisEntry } from "./resolution.js";
import { mergeStarExportSurface } from "./export-star-resolution.js";
import type {
    ExportOrigin,
    LocalExportOrigin
} from "./export-star-resolution.js";
import { hotPublicTargetId } from "../public-target/index.js";
import type { HotPublicFunctionLocator } from "../types.js";
import {
    addPatternBindings,
    functionTypes,
    isUnboundGlobalReference,
    memberPropertyName,
    unwrapExpression
} from "./rules/index.js";
import { deriveV8CodeCreationAnchor } from "./runtime-locations/v8-code-creation/derive.js";

interface PublicExportOrigin extends LocalExportOrigin {
    publicPath: string;
    direct: boolean;
    publicTarget: HotPublicFunctionLocator;
}

const exportNameOf = (entry: StaticExportEntry) =>
    entry.exportName.kind === "Default"
        ? "default"
        : (entry.exportName.name ?? undefined);

const collectCommonJsOrigins = (parsed: ParsedFile) => {
    const functionReturns = new Map<string, string>();
    const aliases = new Map<string, string>();
    const exportedValues = new Set<string>();
    const memberAssignments: {
        owner: string;
        property: string;
        localName?: string;
        start: number;
        end: number;
    }[] = [];
    const directOrigins: PublicExportOrigin[] = [];
    const recordDirectOrigin = (
        publicPath: string,
        value: unknown,
        start: number,
        end: number
    ) => {
        const unwrapped = unwrapExpression(value);
        const localName = nodeName(unwrapped);
        directOrigins.push({
            kind: "local",
            file: parsed.file,
            ...(localName ? { localName } : {}),
            start: unwrapped?.start ?? start,
            end: unwrapped?.end ?? end,
            publicPath,
            direct: true,
            publicTarget: { modulePath: ".", exportPath: [publicPath] }
        });
    };

    const recordExportObject = (value: AstNode) => {
        if (
            value.type !== "ObjectExpression" ||
            !Array.isArray(value.properties)
        ) {
            return false;
        }
        for (const propertyValue of value.properties) {
            if (!isNode(propertyValue) || propertyValue.type !== "Property") {
                continue;
            }
            const property = nodeName(propertyValue.key);
            if (!property) continue;
            recordDirectOrigin(
                property,
                propertyValue.value,
                propertyValue.start,
                propertyValue.end
            );
        }
        return true;
    };

    const recordFunctionReturn = (functionName: string, node: AstNode) => {
        const returned = new Set<string>();
        walk(node, [], (child, ancestors) => {
            if (
                child !== node &&
                functionTypes.has(child.type) &&
                ancestors.length > 0
            ) {
                return false;
            }
            if (child.type === "ReturnStatement") {
                const name = nodeName(child.argument);
                if (name) returned.add(name);
            }
        });
        if (returned.size === 1) {
            functionReturns.set(functionName, [...returned][0]);
        }
    };

    walk(parsed.program as unknown as AstNode, [], (node, ancestors) => {
        const insideFunction = ancestors.some(ancestor =>
            functionTypes.has(ancestor.type)
        );
        if (node.type === "TSExportAssignment" && !insideFunction) {
            recordDirectOrigin(
                "default",
                node.expression,
                node.start,
                node.end
            );
            return false;
        }
        if (node.type === "FunctionDeclaration" && !insideFunction) {
            const functionName = nodeName(node.id);
            if (functionName) recordFunctionReturn(functionName, node);
            return false;
        }
        if (insideFunction) return false;
        if (node.type === "VariableDeclarator") {
            const local = nodeName(node.id);
            if (!local || !isNode(node.init)) return;
            const initializer = unwrapExpression(node.init) ?? node.init;
            if (
                initializer.type === "FunctionExpression" ||
                initializer.type === "ArrowFunctionExpression"
            ) {
                recordFunctionReturn(local, initializer);
            }
            const direct = nodeName(initializer);
            if (direct) aliases.set(local, direct);
            if (initializer.type === "CallExpression") {
                const returned = functionReturns.get(
                    nodeName(initializer.callee) ?? ""
                );
                if (returned) aliases.set(local, returned);
            }
        }
        if (
            node.type !== "AssignmentExpression" ||
            !isNode(node.left) ||
            insideFunction
        )
            return;
        const left = node.left;
        const right = unwrapExpression(node.right);
        if (left.type !== "MemberExpression" || !right) return;
        const property = memberPropertyName(left);
        if (!property) return;
        const owner = nodeName(left.object);
        const program = parsed.program as unknown as AstNode;
        const leftAncestors = [...ancestors, node, left];
        if (owner === "module" && property === "exports") {
            if (
                isNode(left.object) &&
                isUnboundGlobalReference(
                    program,
                    "module",
                    left.object,
                    leftAncestors
                )
            ) {
                const rightName = nodeName(right);
                if (rightName) exportedValues.add(rightName);
                if (!recordExportObject(right)) {
                    recordDirectOrigin("default", right, node.start, node.end);
                }
            }
            return;
        }
        if (owner === "exports") {
            if (
                isNode(left.object) &&
                isUnboundGlobalReference(
                    program,
                    "exports",
                    left.object,
                    leftAncestors
                )
            ) {
                const rightName = nodeName(right);
                if (rightName) {
                    memberAssignments.push({
                        owner: "exports",
                        property,
                        localName: rightName,
                        start: node.start,
                        end: node.end
                    });
                } else {
                    recordDirectOrigin(property, right, node.start, node.end);
                }
            }
            return;
        }
        if (
            isNode(left.object) &&
            left.object.type === "MemberExpression" &&
            memberPropertyName(left.object) === "exports" &&
            isNode(left.object.object) &&
            nodeName(left.object.object) === "module"
        ) {
            if (
                isUnboundGlobalReference(
                    program,
                    "module",
                    left.object.object,
                    [...leftAncestors, left.object]
                )
            ) {
                const rightName = nodeName(right);
                if (rightName) {
                    memberAssignments.push({
                        owner: "exports",
                        property,
                        localName: rightName,
                        start: node.start,
                        end: node.end
                    });
                } else {
                    recordDirectOrigin(property, right, node.start, node.end);
                }
            }
            return;
        }
        const rightName = nodeName(right);
        if (owner) {
            memberAssignments.push({
                owner,
                property,
                ...(rightName ? { localName: rightName } : {}),
                start: right.start,
                end: right.end
            });
        }
    });

    const resolveAlias = (name: string) => {
        const seen = new Set<string>();
        let current = name;
        while (aliases.has(current) && !seen.has(current)) {
            seen.add(current);
            current = aliases.get(current) as string;
        }
        return current;
    };
    const exportedObjects = new Set(
        [...exportedValues].map(value => resolveAlias(value))
    );
    const origins: PublicExportOrigin[] = [...directOrigins];
    for (const assignment of memberAssignments) {
        if (
            assignment.owner !== "exports" &&
            !exportedObjects.has(resolveAlias(assignment.owner))
        ) {
            continue;
        }
        origins.push({
            kind: "local",
            file: parsed.file,
            ...(assignment.localName
                ? { localName: assignment.localName }
                : {}),
            start: assignment.start,
            end: assignment.end,
            publicPath: assignment.property,
            direct: true,
            publicTarget: {
                modulePath: ".",
                exportPath: [assignment.property]
            }
        });
    }
    return origins;
};

const collectCommonJsNamespaceDependencies = (parsed: ParsedFile) => {
    const dependencies: string[] = [];
    const importEqualsDependencies = new Map<string, string>();
    const program = parsed.program as unknown as AstNode;
    walk(parsed.program as unknown as AstNode, [], (node, ancestors) => {
        if (
            node.type === "TSImportEqualsDeclaration" &&
            !ancestors.some(ancestor => functionTypes.has(ancestor.type)) &&
            node.importKind !== "type" &&
            isNode(node.moduleReference) &&
            node.moduleReference.type === "TSExternalModuleReference" &&
            isNode(node.moduleReference.expression) &&
            node.moduleReference.expression.type === "Literal" &&
            typeof node.moduleReference.expression.value === "string"
        ) {
            const dependency = parsed.dependencies.get(
                moduleDependencyKey(
                    node.moduleReference.expression.value,
                    "require"
                )
            );
            const localName = nodeName(node.id);
            if (dependency && localName) {
                importEqualsDependencies.set(localName, dependency);
            }
            return false;
        }
        if (
            node.type === "TSExportAssignment" &&
            !ancestors.some(ancestor => functionTypes.has(ancestor.type))
        ) {
            const dependency = importEqualsDependencies.get(
                nodeName(node.expression) ?? ""
            );
            if (dependency) dependencies.push(dependency);
            return false;
        }
        if (
            node.type !== "AssignmentExpression" ||
            ancestors.some(ancestor => functionTypes.has(ancestor.type)) ||
            !isNode(node.left) ||
            node.left.type !== "MemberExpression" ||
            nodeName(node.left.object) !== "module" ||
            memberPropertyName(node.left) !== "exports" ||
            !isNode(node.left.object) ||
            !isUnboundGlobalReference(program, "module", node.left.object, [
                ...ancestors,
                node,
                node.left
            ])
        ) {
            return;
        }
        const right = unwrapExpression(node.right);
        if (
            !right ||
            right.type !== "CallExpression" ||
            nodeName(right.callee) !== "require" ||
            !Array.isArray(right.arguments) ||
            !isNode(right.callee) ||
            !isUnboundGlobalReference(program, "require", right.callee, [
                ...ancestors,
                node,
                right
            ])
        ) {
            return;
        }
        const request = right.arguments[0];
        if (
            isNode(request) &&
            request.type === "Literal" &&
            typeof request.value === "string"
        ) {
            const dependency = parsed.dependencies.get(
                moduleDependencyKey(request.value, "require")
            );
            if (dependency) dependencies.push(dependency);
        }
    });
    return dependencies;
};

const displayPublicTarget = (target: HotPublicFunctionLocator) => {
    const exportPath = target.exportPath.join(".");
    return target.modulePath === "."
        ? exportPath
        : `${target.modulePath}:${exportPath}`;
};

export const collectPublicExportOrigins = (
    entries: readonly AnalysisEntry[],
    parsedFiles: readonly ParsedFile[]
) => {
    const parsedByFile = new Map(
        parsedFiles.map(parsed => [parsed.file, parsed])
    );
    const memo = new Map<string, Map<string, ExportOrigin>>();

    const surfaceFor = (file: string): Map<string, ExportOrigin> => {
        const cached = memo.get(file);
        if (cached) return cached;
        const surface = new Map<string, ExportOrigin>();
        memo.set(file, surface);
        const parsed = parsedByFile.get(file);
        if (!parsed) return surface;

        for (const origin of collectCommonJsOrigins(parsed)) {
            surface.set(origin.publicPath, {
                kind: "local",
                file: origin.file,
                localName: origin.localName,
                start: origin.start,
                end: origin.end
            });
        }
        for (const dependency of collectCommonJsNamespaceDependencies(parsed)) {
            if (!parsedByFile.has(dependency)) continue;
            for (const [name, origin] of surfaceFor(dependency)) {
                if (!surface.has(name)) surface.set(name, origin);
            }
        }

        const importedOrigins = new Map<string, ExportOrigin>();
        for (const declaration of parsed.module.staticImports) {
            const dependency = parsed.dependencies.get(
                moduleDependencyKey(declaration.moduleRequest.value, "import")
            );
            if (!dependency || !parsedByFile.has(dependency)) continue;
            const dependencySurface = surfaceFor(dependency);
            for (const item of declaration.entries) {
                if (item.isType) continue;
                const localName = item.localName.value;
                if (item.importName.kind === "NamespaceObject") {
                    importedOrigins.set(localName, {
                        kind: "namespace",
                        file: dependency
                    });
                    continue;
                }
                const importedName =
                    item.importName.kind === "Default"
                        ? "default"
                        : item.importName.name;
                if (!importedName) continue;
                const origin = dependencySurface.get(importedName);
                if (origin) importedOrigins.set(localName, origin);
            }
        }

        // Explicit exports are resolved before star exports regardless of source
        // order. ESM ambiguity only applies to names contributed by export *.
        for (const group of parsed.module.staticExports) {
            for (const item of group.entries) {
                if (item.isType) continue;
                const exported = exportNameOf(item);
                if (item.importName.kind === "AllButDefault") continue;
                if (!item.moduleRequest) {
                    if (!exported) continue;
                    const imported = item.localName.name
                        ? importedOrigins.get(item.localName.name)
                        : undefined;
                    if (imported) {
                        surface.set(exported, imported);
                        continue;
                    }
                    surface.set(exported, {
                        kind: "local",
                        file,
                        localName: item.localName.name ?? undefined,
                        start: group.start,
                        end: group.end
                    });
                    continue;
                }

                const importedLocal = item.importName.name
                    ? importedOrigins.get(item.importName.name)
                    : undefined;
                if (importedLocal && exported) {
                    surface.set(exported, importedLocal);
                    continue;
                }

                const dependency = parsed.dependencies.get(
                    moduleDependencyKey(item.moduleRequest.value, "import")
                );
                if (!dependency || !parsedByFile.has(dependency)) continue;
                const dependencySurface = surfaceFor(dependency);
                if (item.importName.kind === "All" && exported) {
                    surface.set(exported, {
                        kind: "namespace",
                        file: dependency
                    });
                } else if (item.importName.name && exported) {
                    const origin = dependencySurface.get(item.importName.name);
                    if (origin) surface.set(exported, origin);
                }
            }
        }

        const explicitNames = new Set(surface.keys());
        const ambiguousStarNames = new Set<string>();
        for (const group of parsed.module.staticExports) {
            for (const item of group.entries) {
                if (
                    item.isType ||
                    item.importName.kind !== "AllButDefault" ||
                    !item.moduleRequest
                ) {
                    continue;
                }
                const dependency = parsed.dependencies.get(
                    moduleDependencyKey(item.moduleRequest.value, "import")
                );
                if (!dependency || !parsedByFile.has(dependency)) continue;
                mergeStarExportSurface(
                    surface,
                    surfaceFor(dependency),
                    explicitNames,
                    ambiguousStarNames
                );
            }
        }
        return surface;
    };

    const originsByFile = new Map<string, PublicExportOrigin[]>();
    const flatten = (
        publicTarget: HotPublicFunctionLocator,
        origin: ExportOrigin,
        direct: boolean,
        seen: ReadonlySet<string>
    ) => {
        if (origin.kind === "local") {
            const origins = originsByFile.get(origin.file) ?? [];
            origins.push({
                ...origin,
                publicPath: displayPublicTarget(publicTarget),
                publicTarget,
                direct
            });
            originsByFile.set(origin.file, origins);
            return;
        }
        if (seen.has(origin.file)) return;
        const nextSeen = new Set(seen).add(origin.file);
        for (const [name, nested] of surfaceFor(origin.file)) {
            flatten(
                {
                    modulePath: publicTarget.modulePath,
                    exportPath: [...publicTarget.exportPath, name]
                },
                nested,
                false,
                nextSeen
            );
        }
    };

    for (const publicEntry of entries) {
        for (const [name, origin] of surfaceFor(publicEntry.file)) {
            flatten(
                {
                    modulePath: publicEntry.publicPath,
                    exportPath: [name]
                },
                origin,
                true,
                new Set([publicEntry.file])
            );
        }
    }
    return originsByFile;
};

const enclosingClass = (ancestors: readonly AstNode[]) => {
    for (let index = ancestors.length - 1; index >= 0; index--) {
        const ancestor = ancestors[index];
        if (
            ancestor.type === "ClassDeclaration" ||
            ancestor.type === "ClassExpression"
        ) {
            return ancestor;
        }
    }
};

const inferFunctionName = (node: AstNode, ancestors: readonly AstNode[]) => {
    const direct = nodeName(node.id);
    if (direct) return direct;
    const parent = ancestors.at(-1);
    if (!parent) return "anonymous";
    if (parent.type === "MethodDefinition" || parent.type === "Property") {
        return nodeName(parent.key) ?? "computed";
    }
    if (parent.type === "VariableDeclarator") {
        return nodeName(parent.id) ?? "anonymous";
    }
    if (parent.type === "AssignmentExpression") {
        const left = parent.left;
        if (isNode(left) && left.type === "MemberExpression") {
            return nodeName(left.property) ?? "computed";
        }
    }
    return "anonymous";
};

const isTransparentFunctionWrapper = (node: AstNode, child: AstNode) =>
    (node.type === "ParenthesizedExpression" ||
        node.type === "TSAsExpression" ||
        node.type === "TSSatisfiesExpression" ||
        node.type === "TSNonNullExpression") &&
    node.expression === child;

const hasTopLevelStatementChain = (
    ancestors: readonly AstNode[],
    ownerIndex: number,
    expectedParentType?: string
) => {
    let index = ownerIndex - 1;
    if (expectedParentType) {
        if (ancestors[index]?.type !== expectedParentType) return false;
        index--;
    }
    if (
        ancestors[index]?.type === "ExportNamedDeclaration" ||
        ancestors[index]?.type === "ExportDefaultDeclaration"
    ) {
        index--;
    }
    return index === 0 && ancestors[index]?.type === "Program";
};

/**
 * Return the lexical binding that can carry this exact callable to an ESM/CJS
 * export. A display name is not a binding identity: object methods and nested
 * callbacks may legitimately have the same name as an exported function.
 */
const topLevelFunctionBindingName = (
    node: AstNode,
    ancestors: readonly AstNode[]
) => {
    if (
        ancestors.some(ancestor => functionTypes.has(ancestor.type)) ||
        ancestors.length === 0
    ) {
        return;
    }

    if (node.type === "FunctionDeclaration") {
        return hasTopLevelStatementChain(ancestors, ancestors.length)
            ? nodeName(node.id)
            : undefined;
    }

    let child = node;
    let ownerIndex = ancestors.length - 1;
    while (
        ownerIndex >= 0 &&
        isTransparentFunctionWrapper(ancestors[ownerIndex], child)
    ) {
        child = ancestors[ownerIndex];
        ownerIndex--;
    }
    const owner = ancestors[ownerIndex];
    if (
        owner?.type === "VariableDeclarator" &&
        owner.init === child &&
        hasTopLevelStatementChain(ancestors, ownerIndex, "VariableDeclaration")
    ) {
        return nodeName(owner.id);
    }
    if (
        owner?.type === "AssignmentExpression" &&
        owner.right === child &&
        hasTopLevelStatementChain(ancestors, ownerIndex, "ExpressionStatement")
    ) {
        return nodeName(owner.left);
    }
};

export const collectCandidateNodes = (
    parsed: ParsedFile,
    publicOrigins: readonly PublicExportOrigin[]
) => {
    const candidates: CandidateNode[] = [];
    const seen = new Set<number>();
    const markerCandidates: { nodeStart: number; declarationStart: number }[] =
        [];
    walk(parsed.program as unknown as AstNode, [], (node, ancestors) => {
        if (!functionTypes.has(node.type)) return;
        markerCandidates.push({
            nodeStart: node.start,
            declarationStart: annotationDeclarationStart(node, ancestors)
        });
    });
    const markerBindings = bindHotMarkerComments(
        parsed.comments,
        parsed.source,
        markerCandidates
    );
    const markerByNodeStart = new Map(
        parsed.comments.flatMap(comment => {
            const nodeStart = markerBindings.get(comment.start);
            const marker = hotMarkerFromComment(comment.value);
            return nodeStart !== undefined && marker
                ? [[nodeStart, marker] as const]
                : [];
        })
    );

    walk(parsed.program as unknown as AstNode, [], (node, ancestors) => {
        if (!functionTypes.has(node.type) || seen.has(node.start)) return;
        seen.add(node.start);
        const name = inferFunctionName(node, ancestors);
        const bindingName = topLevelFunctionBindingName(node, ancestors);
        const classNode = enclosingClass(ancestors);
        const className = classNode ? nodeName(classNode.id) : undefined;
        const nestedInFunction = ancestors.some(ancestor =>
            functionTypes.has(ancestor.type)
        );
        const namedOrigins = bindingName
            ? publicOrigins.filter(origin => origin.localName === bindingName)
            : [];
        const classOrigins =
            className && !nestedInFunction
                ? publicOrigins.filter(origin => origin.localName === className)
                : [];
        const rangeOrigins = nestedInFunction
            ? []
            : publicOrigins.filter(
                  origin =>
                      !origin.localName &&
                      origin.start <= node.start &&
                      origin.end >= node.end
              );
        const origins = [...namedOrigins, ...classOrigins, ...rangeOrigins];
        const publicPaths = [
            ...new Set(origins.map(origin => origin.publicPath))
        ].toSorted();
        const publicTargets = [
            ...new Map(
                origins.map(origin => [
                    hotPublicTargetId(origin.publicTarget),
                    origin.publicTarget
                ])
            ).values()
        ].toSorted((left, right) =>
            hotPublicTargetId(left).localeCompare(hotPublicTargetId(right))
        );
        const exportName = className
            ? undefined
            : origins.find(
                  origin =>
                      origin.direct &&
                      origin.publicTarget.modulePath === "." &&
                      origin.publicTarget.exportPath.length === 1
              )?.publicTarget.exportPath[0];
        const targetId = className
            ? undefined
            : publicTargets[0]
              ? hotPublicTargetId(publicTargets[0])
              : undefined;
        const parent = ancestors.at(-1);
        const kind =
            parent?.type === "MethodDefinition"
                ? "method"
                : node.type === "ArrowFunctionExpression"
                  ? "arrow"
                  : "function";
        const parameters = node.params;
        const parameterBindings = Array.isArray(parameters)
            ? parameters.flatMap((parameter, index) => {
                  const bindings: ParameterFlow[] = [];
                  addPatternBindings(parameter, index, [], bindings);
                  return bindings;
              })
            : [];
        candidates.push({
            node,
            runtimeNode:
                parent?.type === "MethodDefinition" ||
                (parent?.type === "Property" && parent.method === true)
                    ? parent
                    : node,
            stripStaticRuntimePrefix:
                parent?.type === "MethodDefinition" && parent.static === true,
            v8CodeCreation: deriveV8CodeCreationAnchor(
                parsed.source,
                node,
                parent
            ),
            name,
            kind,
            classNode,
            className,
            exported: publicPaths.length > 0,
            exportName,
            targetId,
            publicTargets,
            publicPaths,
            annotation: markerByNodeStart.get(node.start),
            arity: Array.isArray(parameters) ? parameters.length : 0,
            parameterNames: parameterBindings.map(binding => binding.name),
            parameterBindings
        });
    });
    return candidates;
};
