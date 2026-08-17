import type { EcmaScriptModule, Program } from "oxc-parser";

import { isNode, nodeName, walk } from "../ast.js";
import type { AstNode } from "../ast.js";
import { moduleDependencyKey } from "../internal-model.js";
import type { ModuleRequestMode } from "../internal-model.js";
import { isNameShadowedBetween } from "../rules/dataflow.js";
import { isUnboundGlobalReference, unwrapExpression } from "../rules/index.js";

/** Literal module edge plus its conditional-export branch. */
export interface ModuleRequest {
    request: string;
    mode: ModuleRequestMode;
}

const staticModuleRequests = (module: EcmaScriptModule): ModuleRequest[] => [
    ...module.staticImports.flatMap(item =>
        item.entries.length === 0 || item.entries.some(entry => !entry.isType)
            ? [
                  {
                      request: item.moduleRequest.value,
                      mode: "import" as const
                  }
              ]
            : []
    ),
    ...module.staticExports.flatMap(item =>
        item.entries.flatMap(entry =>
            entry.moduleRequest && !entry.isType
                ? [
                      {
                          request: entry.moduleRequest.value,
                          mode: "import" as const
                      }
                  ]
                : []
        )
    )
];

const runtimeModuleRequests = (
    program: Program,
    file: string,
    diagnostics: string[]
): ModuleRequest[] => {
    const requests: ModuleRequest[] = [];
    const createRequireImports = new Set<string>();
    for (const statement of program.body) {
        if (
            statement.type !== "ImportDeclaration" ||
            (statement.source.value !== "node:module" &&
                statement.source.value !== "module")
        ) {
            continue;
        }
        for (const specifier of statement.specifiers) {
            if (
                specifier.type === "ImportSpecifier" &&
                nodeName(specifier.imported as unknown as AstNode) ===
                    "createRequire" &&
                isNode(specifier.local)
            ) {
                createRequireImports.add(nodeName(specifier.local) as string);
            }
        }
    }
    const createdRequireBindings = new Set<string>();
    for (const statement of program.body) {
        const declaration =
            statement.type === "ExportNamedDeclaration" &&
            isNode(statement.declaration)
                ? statement.declaration
                : (statement as unknown as AstNode);
        if (
            declaration.type !== "VariableDeclaration" ||
            !Array.isArray(declaration.declarations)
        ) {
            continue;
        }
        for (const declarator of declaration.declarations) {
            if (
                !isNode(declarator) ||
                !isNode(declarator.id) ||
                declarator.id.type !== "Identifier" ||
                !isNode(declarator.init) ||
                declarator.init.type !== "CallExpression" ||
                !isNode(declarator.init.callee) ||
                !createRequireImports.has(
                    nodeName(declarator.init.callee) ?? ""
                )
            ) {
                continue;
            }
            createdRequireBindings.add(declarator.id.name as string);
        }
    }
    walk(program as unknown as AstNode, [], (node, ancestors) => {
        if (
            node.type === "TSImportEqualsDeclaration" &&
            node.importKind !== "type" &&
            isNode(node.moduleReference) &&
            node.moduleReference.type === "TSExternalModuleReference" &&
            isNode(node.moduleReference.expression) &&
            node.moduleReference.expression.type === "Literal" &&
            typeof node.moduleReference.expression.value === "string"
        ) {
            requests.push({
                request: node.moduleReference.expression.value,
                mode: "require"
            });
            return false;
        }
        if (node.type === "ImportExpression") {
            const source = unwrapExpression(node.source);
            if (
                source?.type === "Literal" &&
                typeof source.value === "string"
            ) {
                requests.push({ request: source.value, mode: "import" });
            } else {
                diagnostics.push(
                    `${file}: nonliteral dynamic import at offset ${node.start} makes the module graph incomplete`
                );
            }
            return;
        }
        if (node.type !== "CallExpression" || !isNode(node.callee)) return;
        const callee = node.callee;
        const argumentsValue = node.arguments;
        const calleeName = nodeName(callee);
        const createdRequire =
            calleeName !== undefined &&
            createdRequireBindings.has(calleeName) &&
            !isNameShadowedBetween(
                program as unknown as AstNode,
                calleeName,
                ancestors
            );
        const globalRequire =
            calleeName === "require" &&
            isUnboundGlobalReference(
                program as unknown as AstNode,
                "require",
                callee,
                [...ancestors, node]
            );
        if (createdRequire || globalRequire) {
            const argument = Array.isArray(argumentsValue)
                ? unwrapExpression(argumentsValue[0])
                : undefined;
            if (
                argument?.type === "Literal" &&
                typeof argument.value === "string"
            ) {
                requests.push({ request: argument.value, mode: "require" });
            } else {
                diagnostics.push(
                    `${file}: nonliteral require at offset ${node.start} makes the module graph incomplete`
                );
            }
        }
    });
    return requests;
};

/** Collect and de-duplicate every statically knowable runtime module edge. */
export const collectModuleRequests = (
    program: Program,
    module: EcmaScriptModule,
    file: string,
    diagnostics: string[]
) => [
    ...new Map(
        [
            ...staticModuleRequests(module),
            ...runtimeModuleRequests(program, file, diagnostics)
        ].map(request => [
            moduleDependencyKey(request.request, request.mode),
            request
        ])
    ).values()
];
