import type { Comment } from "oxc-parser";

import type { AstNode } from "./ast.js";

const declarationBoundaries = new Set([
    "ArrayExpression",
    "BlockStatement",
    "ClassBody",
    "ObjectExpression",
    "Program",
    "StaticBlock",
    "SwitchCase"
]);
const markerPattern =
    /^[\t ]*(?:\*[\t ]*)?check-hot:\s*([A-Za-z0-9_$#.:/-]+)/mu;

/** One function-like AST owner that may receive a preceding marker. */
export interface HotAnnotationOwnerCandidate {
    nodeStart: number;
    declarationStart: number;
}

/** Read one marker ID from an Oxc comment value. */
export const hotMarkerFromComment = (value: string) =>
    markerPattern.exec(value)?.[1];

/** Find the statement/declaration boundary to which a marker can attach. */
export const annotationDeclarationStart = (
    node: AstNode,
    ancestors: readonly AstNode[]
) => {
    let start = node.start;
    for (const ancestor of ancestors.toReversed()) {
        if (declarationBoundaries.has(ancestor.type)) break;
        start = ancestor.start;
    }
    return start;
};

const containsOnlyTrivia = (
    source: string,
    comments: readonly Comment[],
    start: number,
    end: number
) => {
    let cursor = start;
    for (const comment of comments) {
        if (comment.start < start || comment.end > end) continue;
        if (source.slice(cursor, comment.start).trim().length > 0) return false;
        cursor = comment.end;
    }
    return source.slice(cursor, end).trim().length === 0;
};

/** Bind each marker to only the first following function declaration. */
export const bindHotMarkerComments = (
    comments: readonly Comment[],
    source: string,
    candidates: readonly HotAnnotationOwnerCandidate[]
) => {
    const sortedCandidates = candidates.toSorted(
        (left, right) =>
            left.declarationStart - right.declarationStart ||
            left.nodeStart - right.nodeStart
    );
    const bindings = new Map<number, number>();
    for (const comment of comments) {
        if (!hotMarkerFromComment(comment.value)) continue;
        const candidate = sortedCandidates.find(value => {
            if (
                value.declarationStart < comment.end ||
                value.declarationStart - comment.end >= 400
            ) {
                return false;
            }
            const gap = source.slice(comment.end, value.declarationStart);
            return (
                gap.split("\n").length <= 5 &&
                containsOnlyTrivia(
                    source,
                    comments,
                    comment.end,
                    value.declarationStart
                )
            );
        });
        if (candidate) bindings.set(comment.start, candidate.nodeStart);
    }
    return bindings;
};
