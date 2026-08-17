import { describe, expect, test } from "vitest";

import { analyzerFixture } from "../test-fixture.test-utils.js";

const analyze = analyzerFixture("complexity");
const sourceWithLines = (lines: number) =>
    [
        "export function hot() {",
        ...Array.from({ length: lines - 2 }, (_, index) => `  void ${index};`),
        "}"
    ].join("\n");

describe("compilation complexity detector", () => {
    test("reports a function with at least sixteen branches", async () => {
        const branches = Array.from(
            { length: 16 },
            (_, index) => `if (value === ${index}) return ${index};`
        ).join(" ");
        const report = await analyze(
            `export function hot(value) { ${branches} return -1; }`
        );

        expect(report.findings.map(finding => finding.rule)).toContain(
            "large-complex-function"
        );
    });

    test("enforces both size and branch boundaries", async () => {
        const belowSize = await analyze(sourceWithLines(99));
        const atSize = await analyze(sourceWithLines(100));
        const belowBranches = await analyze(
            `export function branches(value) { ${Array.from(
                { length: 15 },
                (_, index) => `if (value === ${index}) return ${index};`
            ).join(" ")} return -1; }`
        );

        expect(
            belowSize.findings.some(
                finding => finding.rule === "large-complex-function"
            )
        ).toBe(false);
        expect(
            belowBranches.findings.some(
                finding => finding.rule === "large-complex-function"
            )
        ).toBe(false);
        expect(
            atSize.findings.find(
                finding => finding.rule === "large-complex-function"
            )
        ).toMatchObject({
            severity: "info",
            message:
                "The function spans 100 lines and has 0 branch nodes, making tiering and scenario coverage harder to reason about.",
            suggestion:
                "Split report scenarios by major branch family; refactor only if profiling shows compilation or inlining pressure."
        });
    });
});
