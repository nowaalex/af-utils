import { visitorKeys } from "oxc-parser";

/** Minimal shared shape implemented by every Oxc AST node. */
export interface AstNode {
    type: string;
    start: number;
    end: number;
    [key: string]: unknown;
}

/** Narrow an unknown Oxc property to an AST node. */
export const isNode = (value: unknown): value is AstNode =>
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof value.type === "string" &&
    "start" in value &&
    typeof value.start === "number" &&
    "end" in value &&
    typeof value.end === "number";

/** Return the identifier-like name carried by a node. */
export const nodeName = (node: unknown) => {
    if (!isNode(node)) return;
    return typeof node.name === "string"
        ? node.name
        : typeof node.value === "string"
          ? node.value
          : undefined;
};

/** Enumerate structural AST children using Oxc's visitor metadata. */
export const childrenOf = (node: AstNode) => {
    const children: AstNode[] = [];
    for (const key of visitorKeys[node.type] ?? []) {
        const value = node[key];
        if (Array.isArray(value)) {
            for (const item of value) if (isNode(item)) children.push(item);
        } else if (isNode(value)) {
            children.push(value);
        }
    }
    return children;
};

/** Depth-first AST walk that can prune a subtree by returning `false`. */
export const walk = (
    node: AstNode,
    ancestors: readonly AstNode[],
    visit: (node: AstNode, ancestors: readonly AstNode[]) => boolean | void
) => {
    if (visit(node, ancestors) === false) return;
    const nextAncestors = [...ancestors, node];
    for (const child of childrenOf(node)) walk(child, nextAncestors, visit);
};

/** Build zero-based source offsets for each physical line. */
export const lineStartsFor = (source: string) => {
    const starts = [0];
    for (let index = 0; index < source.length; index++) {
        if (source[index] === "\n") starts.push(index + 1);
    }
    return starts;
};

/** Convert a source offset to a one-based line and column. */
export const locate = (lineStarts: readonly number[], offset: number) => {
    let low = 0;
    let high = lineStarts.length;
    while (low + 1 < high) {
        const middle = Math.floor((low + high) / 2);
        if (lineStarts[middle] <= offset) low = middle;
        else high = middle;
    }
    return { line: low + 1, column: offset - lineStarts[low] + 1 };
};
