import type { HotProblemOccurrence } from "./types.js";
import type { HotProblemId } from "./catalog.js";

/** Error carrying a catalog problem ID across checker boundaries. */
export class HotProblemError extends Error {
    /** Stable catalog ID associated with this failure. */
    readonly problemId: HotProblemId;

    /** Construct a structured check-hot failure. */
    constructor(
        problemId: HotProblemId,
        message: string,
        options?: ErrorOptions
    ) {
        super(message, options);
        this.name = "HotProblemError";
        this.problemId = problemId;
    }
}

/** Convert any caught value into exactly one structured occurrence. */
export const recordCaughtProblem = (
    problems: HotProblemOccurrence[],
    error: unknown,
    fallbackProblemId: HotProblemId = "runtime-worker-execution-failure",
    messagePrefix = ""
) => {
    const message = error instanceof Error ? error.message : String(error);
    problems.push({
        problemId:
            error instanceof HotProblemError
                ? error.problemId
                : fallbackProblemId,
        message: `${messagePrefix}${message}`,
        ...(error instanceof Error && error.stack
            ? { detail: error.stack }
            : {})
    });
};
