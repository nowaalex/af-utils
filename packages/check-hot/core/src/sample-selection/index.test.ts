import { describe, expect, test } from "vitest";

import {
    assertHotSelectedSample,
    finalizeHotSampleSelection
} from "./index.js";
import type { HotPreflightOutcome } from "../types.js";

const outcome = (
    sampleId: string,
    status: "accepted" | "blocked",
    reason?: string
): HotPreflightOutcome => ({
    obligationId: "obligation",
    scenarioId: "scenario",
    sampleId,
    evidenceId: "evidence",
    mutationFamily: "numeric-representation",
    status,
    semanticVerification: "mutation-verified",
    ...(reason ? { reason } : {})
});
const identity = {
    obligationId: "obligation",
    evidenceId: "evidence",
    scenarioId: "scenario",
    mutationFamily: "numeric-representation" as const
};

describe("adaptive semantic sample selection", () => {
    test("selects the first accepted candidate in declared order", () => {
        expect(
            finalizeHotSampleSelection(
                ["first", "second", "third"],
                [
                    outcome("first", "blocked", "site miss"),
                    outcome("second", "accepted")
                ],
                identity
            ).sampleId
        ).toBe("second");
    });

    test("returns one bounded blocked outcome with candidate reasons", () => {
        const selected = finalizeHotSampleSelection(
            ["first", "second"],
            [
                outcome("first", "blocked", "verifier failed"),
                outcome("second", "blocked")
            ],
            identity
        );

        expect(selected).toMatchObject({
            sampleId: "first",
            status: "blocked"
        });
        expect(selected.reason).toBe(
            "No accepted semantic sample for obligation: first: verifier failed; second: blocked without a reason"
        );

        const manySampleIds = Array.from(
            { length: 10 },
            (_, index) => `sample-${index}`
        );
        const bounded = finalizeHotSampleSelection(
            manySampleIds,
            manySampleIds.map(sampleId =>
                outcome(sampleId, "blocked", "x".repeat(1_000))
            ),
            identity
        );
        expect(bounded.reason?.length).toBeLessThanOrEqual(2_000);
        expect(bounded.reason).toContain("2 more candidate(s) omitted");
        expect(bounded.reason).not.toContain("sample-8:");
    });

    test("rejects empty, duplicate, missing, and undeclared attempt plans", () => {
        expect(() => finalizeHotSampleSelection([], [], identity)).toThrow(
            "no declared semantic sample candidates"
        );
        expect(() =>
            finalizeHotSampleSelection(
                ["same", "same"],
                [outcome("same", "accepted")],
                identity
            )
        ).toThrow("duplicate semantic sample candidates");
        expect(() =>
            finalizeHotSampleSelection(["declared"], [], identity)
        ).toThrow("produced 0 outcomes for 1 semantic sample candidates");
        expect(() =>
            finalizeHotSampleSelection(
                ["declared"],
                [outcome("other", "accepted")],
                identity
            )
        ).toThrow("returned out-of-order sample other; expected declared");
        expect(() =>
            finalizeHotSampleSelection(
                ["first"],
                [
                    outcome("first", "blocked", "miss"),
                    outcome("second", "blocked", "miss")
                ],
                identity
            )
        ).toThrow("produced 2 outcomes for 1 semantic sample candidates");
    });

    test("requires an authenticated unique candidate-order prefix", () => {
        expect(() =>
            finalizeHotSampleSelection(
                ["first", "second"],
                [outcome("second", "accepted")],
                identity
            )
        ).toThrow("out-of-order sample second; expected first");
        expect(() =>
            finalizeHotSampleSelection(
                ["first", "second"],
                [
                    outcome("first", "accepted"),
                    outcome("second", "blocked", "late")
                ],
                identity
            )
        ).toThrow("continued after accepting a semantic sample");
        expect(() =>
            finalizeHotSampleSelection(
                ["first", "second"],
                [outcome("first", "blocked", "miss")],
                identity
            )
        ).toThrow("stopped before every semantic sample was blocked");
        for (const mismatch of [
            { obligationId: "wrong" },
            { evidenceId: "wrong" },
            { scenarioId: "wrong" },
            { mutationFamily: "object-shape" as const }
        ]) {
            expect(() =>
                finalizeHotSampleSelection(
                    ["first"],
                    [{ ...outcome("first", "accepted"), ...mismatch }],
                    identity
                )
            ).toThrow("identity-mismatched outcome for first");
        }
    });

    test("bounds long candidate and obligation identifiers in failure detail", () => {
        const longId = "s".repeat(1_000);
        const longObligationId = "o".repeat(1_000);
        const selected = finalizeHotSampleSelection(
            [longId],
            [
                {
                    ...outcome(longId, "blocked", "r".repeat(1_000)),
                    obligationId: longObligationId
                }
            ],
            { ...identity, obligationId: longObligationId }
        );

        expect(selected.reason).toBe(
            `No accepted semantic sample for ${"o".repeat(80)}: ${"s".repeat(80)}: ${"r".repeat(120)}`
        );
        expect(selected.reason?.length).toBeLessThan(400);
    });

    test("authenticates the persisted choice against plan and loaded samples", () => {
        const accepted = outcome("second", "accepted");
        expect(
            assertHotSelectedSample(
                "scenario",
                ["first", "second"],
                new Set(["first", "second"]),
                accepted
            )
        ).toBe("second");
        expect(() =>
            assertHotSelectedSample(
                "scenario",
                ["first"],
                new Set(["first", "second"]),
                accepted
            )
        ).toThrow("selected undeclared sample second");
        expect(() =>
            assertHotSelectedSample(
                "scenario",
                ["first", "second"],
                new Set(["first"]),
                accepted
            )
        ).toThrow("selected missing sample second");
    });
});
