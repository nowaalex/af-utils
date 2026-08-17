import { readdir, readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseSync } from "oxc-parser";

import { isNode, nodeName, walk } from "./analyzer/ast.js";
import type { AstNode } from "./analyzer/ast.js";
import {
    annotationDeclarationStart,
    bindHotMarkerComments,
    hotMarkerFromComment
} from "./analyzer/annotation-binding.js";
import { functionTypes, memberPropertyName } from "./analyzer/rules/index.js";
import type { HotAnnotationOptions, HotTarget } from "./types.js";
import { annotationProblems } from "./problems/annotation-contract/check.js";

const defaultSourceExtensions = [
    ".c",
    ".cc",
    ".cpp",
    ".cs",
    ".cjs",
    ".cts",
    ".dart",
    ".ex",
    ".exs",
    ".fs",
    ".fsx",
    ".go",
    ".h",
    ".hpp",
    ".java",
    ".js",
    ".jsx",
    ".kt",
    ".lua",
    ".mjs",
    ".mts",
    ".php",
    ".py",
    ".rb",
    ".rs",
    ".scala",
    ".sh",
    ".svelte",
    ".swift",
    ".ts",
    ".tsx",
    ".vue",
    ".zig"
];
const ignoredDirectories = new Set([".git", "dist", "node_modules"]);
const markerPattern =
    /^[\t ]*(?:\/\/|#|\/\*+|\*|<!--|--|;)\s*check-hot:\s*([A-Za-z0-9_$#.:/-]+)/gmu;
const javaScriptExtensions = new Set([
    ".cjs",
    ".cts",
    ".js",
    ".jsx",
    ".mjs",
    ".mts",
    ".ts",
    ".tsx"
]);

/** One source location carrying a `check-hot:` marker. */
export interface HotAnnotationLocation {
    /** Marker ID following `check-hot:`. */
    id: string;
    /** Absolute source path. */
    file: string;
    /** One-based source line. */
    line: number;
    /** AST function/method owner for JS/TS markers. */
    owner?: string;
}

/** Convert a dotted marker ID into a stable JavaScript catalog key. */
export const hotAnnotationTargetAlias = (id: string) => {
    const parts = id.split(/[._]+/u).filter(Boolean);
    if (parts.length < 2) {
        throw new Error(
            `Annotated prototype target ${id} must contain an owner and method`
        );
    }
    return parts
        .map((part, index) =>
            index === 0
                ? `${part[0]?.toLowerCase() ?? ""}${part.slice(1)}`
                : `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`
        )
        .join("");
};

const annotationOwner = (node: AstNode, ancestors: readonly AstNode[]) => {
    const parent = ancestors.at(-1);
    if (parent?.type === "MethodDefinition") {
        const method = nodeName(parent.key);
        const classNode = [...ancestors]
            .toReversed()
            .find(
                ancestor =>
                    ancestor.type === "ClassDeclaration" ||
                    ancestor.type === "ClassExpression"
            );
        const className = classNode ? nodeName(classNode.id) : undefined;
        return className && method ? `${className}.${method}` : method;
    }
    if (parent?.type === "VariableDeclarator") return nodeName(parent.id);
    if (
        parent?.type === "AssignmentExpression" &&
        isNode(parent.left) &&
        parent.left.type === "MemberExpression"
    ) {
        return memberPropertyName(parent.left);
    }
    return nodeName(node.id);
};

const collectFiles = async (
    path: string,
    files: string[],
    extensions: ReadonlySet<string>
) => {
    const metadata = await stat(path);
    if (!metadata.isDirectory()) {
        if (extensions.has(extname(path))) files.push(path);
        return;
    }

    const entries = await readdir(path, { withFileTypes: true });
    await Promise.all(
        entries
            .filter(
                entry =>
                    !entry.isDirectory() || !ignoredDirectories.has(entry.name)
            )
            .map(entry =>
                collectFiles(resolve(path, entry.name), files, extensions)
            )
    );
};

/** Discover all language-independent `check-hot:` source markers. */
export const discoverHotAnnotations = async (
    roots: readonly string[],
    extensions: readonly string[] = defaultSourceExtensions
) => {
    const files: string[] = [];
    const extensionSet = new Set(extensions);
    await Promise.all(
        roots.map(root => collectFiles(root, files, extensionSet))
    );

    const locations = await Promise.all(
        files.toSorted().map(async file => {
            const source = await readFile(file, "utf8");
            if (javaScriptExtensions.has(extname(file))) {
                const parsed = parseSync(file, source, {
                    sourceType: "unambiguous",
                    astType: "ts"
                });
                const ownerCandidates: {
                    nodeStart: number;
                    declarationStart: number;
                    owner: string;
                }[] = [];
                walk(
                    parsed.program as unknown as AstNode,
                    [],
                    (node, ancestors) => {
                        if (!functionTypes.has(node.type)) return;
                        const owner = annotationOwner(node, ancestors);
                        if (owner) {
                            ownerCandidates.push({
                                nodeStart: node.start,
                                declarationStart: annotationDeclarationStart(
                                    node,
                                    ancestors
                                ),
                                owner
                            });
                        }
                    }
                );
                const bindings = bindHotMarkerComments(
                    parsed.comments,
                    source,
                    ownerCandidates
                );
                const ownersByNodeStart = new Map(
                    ownerCandidates.map(candidate => [
                        candidate.nodeStart,
                        candidate.owner
                    ])
                );
                return parsed.comments.flatMap(comment =>
                    hotMarkerFromComment(comment.value)
                        ? [
                              {
                                  id: hotMarkerFromComment(
                                      comment.value
                                  ) as string,
                                  file,
                                  line: source
                                      .slice(0, comment.start)
                                      .split("\n").length,
                                  owner: ownersByNodeStart.get(
                                      bindings.get(comment.start) ?? -1
                                  )
                              }
                          ]
                        : []
                );
            }
            return [...source.matchAll(markerPattern)].map(match => {
                const index = match.index ?? 0;
                return {
                    id: match[1],
                    file,
                    line: source.slice(0, index).split("\n").length
                };
            });
        })
    );
    return locations.flat();
};

/** Validate source markers against a suite's declared target contract. */
export const validateHotAnnotations = async (
    options: HotAnnotationOptions,
    targets: readonly HotTarget<unknown>[],
    suiteUrl: URL
) => {
    const base =
        options.relativeTo === "suite"
            ? fileURLToPath(new URL(".", suiteUrl))
            : process.cwd();
    const roots = options.roots.map(root => resolve(base, root));
    const diagnostics: string[] = [];
    let locations: HotAnnotationLocation[];

    try {
        locations = await discoverHotAnnotations(roots, options.extensions);
    } catch (error) {
        return annotationProblems([
            `Unable to scan check-hot annotations: ${
                error instanceof Error ? error.message : String(error)
            }`
        ]);
    }

    const expected = new Map<
        string,
        { target: string; requireOwnerMatch: boolean }
    >();
    for (const target of targets) {
        if (target.annotation === false) continue;
        const marker = target.annotation ?? target.id;
        const previous = expected.get(marker);
        if (previous) {
            diagnostics.push(
                `Annotation ${marker} is assigned to both ${previous.target} and ${target.id}`
            );
        } else {
            expected.set(marker, {
                target: target.id,
                requireOwnerMatch: target.annotation === undefined
            });
        }
    }

    const found = new Map<string, HotAnnotationLocation[]>();
    for (const location of locations) {
        const matches = found.get(location.id) ?? [];
        matches.push(location);
        found.set(location.id, matches);
    }

    for (const [marker, matches] of found) {
        for (const match of matches) {
            if (javaScriptExtensions.has(extname(match.file)) && !match.owner) {
                diagnostics.push(
                    `Source marker ${marker} is not attached to a JavaScript/TypeScript function (${match.file}:${match.line})`
                );
            }
        }
        if (!expected.has(marker)) {
            diagnostics.push(
                `Source marker ${marker} has no declared target (${matches[0].file}:${matches[0].line})`
            );
        }
        const contract = expected.get(marker);
        if (
            contract?.requireOwnerMatch &&
            matches.length === 1 &&
            matches[0].owner !== contract.target
        ) {
            diagnostics.push(
                `Source marker ${marker} is attached to ${matches[0].owner ?? "no function"}, expected exact owner ${contract.target}`
            );
        }
        if (matches.length > 1) {
            diagnostics.push(
                `Source marker ${marker} occurs ${matches.length} times: ${matches
                    .map(match => `${match.file}:${match.line}`)
                    .join(", ")}`
            );
        }
    }

    if (options.requireTargets ?? true) {
        for (const [marker, contract] of expected) {
            if (!found.has(marker)) {
                diagnostics.push(
                    `Target ${contract.target} is missing source marker check-hot: ${marker}`
                );
            }
        }
    }

    return annotationProblems(diagnostics);
};
