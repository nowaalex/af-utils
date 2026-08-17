import { describe, expect, test } from "vitest";

import { HotProblemError, recordCaughtProblem } from "./error.js";
import type { HotProblemOccurrence } from "./types.js";

describe("structured caught problems", () => {
    test("preserves a feature ID and classifies unknown exceptions", () => {
        const problems: HotProblemOccurrence[] = [];
        recordCaughtProblem(
            problems,
            new HotProblemError("source-integrity-mismatch", "changed")
        );
        recordCaughtProblem(problems, new Error("scenario threw"));

        expect(problems).toEqual([
            expect.objectContaining({
                problemId: "source-integrity-mismatch",
                message: expect.stringContaining("changed")
            }),
            expect.objectContaining({
                problemId: "runtime-worker-execution-failure",
                message: expect.stringContaining("scenario threw")
            })
        ]);
    });
});
