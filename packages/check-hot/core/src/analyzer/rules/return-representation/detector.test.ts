import { describe, expect, test } from "vitest";

import { analyzerFixture } from "../test-fixture.test-utils.js";

const analyze = analyzerFixture("returns");

describe("return representation detector", () => {
    test("reports three concrete return classes", async () => {
        const report = await analyze(
            "export function hot(value) { if (value === 1) return 1; if (value === 2) return null; return {}; }"
        );

        expect(report.findings.map(finding => finding.rule)).toContain(
            "mixed-return-kinds"
        );
    });

    test("reports the exact three-kind contract", async () => {
        const report = await analyze(
            "export function hot(value) { if (value === 1) return 1; if (value === 2) return null; return {}; }"
        );

        expect(
            report.findings.find(
                finding => finding.rule === "mixed-return-kinds"
            )
        ).toMatchObject({
            severity: "info",
            message:
                "The function has several statically distinct return forms (number, null, object).",
            suggestion:
                "Exercise each return form in isolated and combined modes to reveal caller-side representation changes."
        });
    });

    test("requires three concrete ReturnStatement forms", async () => {
        const twoKinds = await analyze(
            "export function two(value) { if (value) return 1; return null; }"
        );
        const unknownKind = await analyze(
            "export function unknown(value) { if (value === 1) return 1; if (value === 2) return null; return value; }"
        );
        const throwIsNotReturn = await analyze(
            "export function throwing(value) { if (value === 1) return null; if (value === 2) return {}; throw 'failure'; }"
        );

        for (const report of [twoKinds, unknownKind, throwIsNotReturn]) {
            expect(
                report.findings.some(
                    finding => finding.rule === "mixed-return-kinds"
                )
            ).toBe(false);
        }
    });
});
