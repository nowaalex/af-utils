import { describe, expect, test } from "vitest";

import { coverageProblem } from "./check.js";

describe("coverage proof problems", () => {
    test.each([
        ["failed", "coverage-obligation-failed"],
        ["blocked", "coverage-obligation-blocked"],
        ["unsupported", "coverage-obligation-unsupported"]
    ] as const)("maps %s to %s", (status, problemId) => {
        expect(
            coverageProblem({
                obligationId: "obligation",
                status,
                reason: "proof reason",
                scenarios: []
            })
        ).toEqual({
            problemId,
            targetId: "obligation",
            message: "proof reason"
        });
    });

    test("does not turn pass or explicit ignore into a problem", () => {
        for (const status of ["passed", "ignored"] as const) {
            expect(
                coverageProblem({
                    obligationId: "obligation",
                    status,
                    reason: "accepted",
                    scenarios: []
                })
            ).toBeUndefined();
        }
    });
});
