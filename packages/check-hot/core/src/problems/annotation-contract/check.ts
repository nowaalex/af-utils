import type { HotProblemOccurrence } from "../types.js";

/** Preserve every annotation drift error as an independently visible problem. */
export const annotationProblems = (
    diagnostics: readonly string[]
): readonly HotProblemOccurrence[] =>
    diagnostics.map(message => ({
        problemId: "annotation-contract-mismatch",
        message
    }));
