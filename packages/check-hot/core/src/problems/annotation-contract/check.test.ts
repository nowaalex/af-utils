import { describe, expect, test } from "vitest";

import { annotationProblems } from "./check.js";

describe("annotation contract problems", () => {
    test("keeps every marker diagnostic independently reportable", () => {
        expect(annotationProblems(["detached", "duplicate"])).toEqual([
            {
                problemId: "annotation-contract-mismatch",
                message: "detached"
            },
            {
                problemId: "annotation-contract-mismatch",
                message: "duplicate"
            }
        ]);
    });
});
