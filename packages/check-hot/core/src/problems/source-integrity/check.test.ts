import { describe, expect, test } from "vitest";

import { runtimeResolutionFailure, sourceIntegrityFailure } from "./check.js";

describe("source integrity problems", () => {
    test("keeps changed bytes distinct from a different runtime artifact", () => {
        expect(sourceIntegrityFailure("changed")).toMatchObject({
            problemId: "source-integrity-mismatch",
            message: "changed"
        });
        expect(runtimeResolutionFailure("different entry")).toMatchObject({
            problemId: "runtime-resolution-mismatch",
            message: "different entry"
        });
    });
});
