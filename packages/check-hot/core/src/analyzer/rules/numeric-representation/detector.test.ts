import { describe, expect, test } from "vitest";

import { analyzerFixture } from "../test-fixture.test-utils.js";
import { numericRepresentationExperiment } from "./experiment.js";

const analyze = analyzerFixture("number");

describe("numeric representation detector", () => {
    test("defines the exact stable-SMI-to-stress transition contract", () => {
        const values = numericRepresentationExperiment.variants.map(
            (_, index) => numericRepresentationExperiment.mutate(7, index)
        );

        expect(values[0]).toBe(1);
        expect(Number.isSafeInteger(values[0] as number)).toBe(true);
        expect(values[1]).toBe(7.25);
        expect(Object.is(values[2], -0)).toBe(true);
        expect(Number.isNaN(values[3])).toBe(true);
        expect(values.slice(4)).toEqual([2 ** 31, 2 ** 32]);
    });

    test("ignores constant arithmetic and links parameter arithmetic", async () => {
        const report = await analyze(
            "const infinity = 1 / 0; export function increment(value) { return value + 1 + infinity; }"
        );
        const numeric = report.findings.filter(
            value => value.rule === "numeric-operation"
        );

        expect(numeric).toHaveLength(2);
        expect(numeric.every(finding => finding.parameterIndex === 0)).toBe(
            true
        );
        expect(
            new Set(numeric.map(finding => `${finding.start}:${finding.end}`))
                .size
        ).toBe(2);
        expect(numeric[0].sourceLine).toContain("value + 1");
    });

    test("resolves a direct local alias", async () => {
        const report = await analyze(
            "export function increment(value) { const alias = value; return alias + 1; } export function accumulate(value) { let alias = value; alias += 2; return alias; }"
        );

        const numeric = report.findings.filter(
            value => value.rule === "numeric-operation"
        );
        expect(numeric).toHaveLength(2);
        expect(numeric.every(finding => finding.parameterIndex === 0)).toBe(
            true
        );
    });

    test("reports every supported numeric operator with the full contract", async () => {
        const binaryOperators = [
            "+",
            "-",
            "*",
            "/",
            "%",
            "**",
            "<<",
            ">>",
            ">>>",
            "&",
            "|",
            "^"
        ];
        const assignmentOperators = binaryOperators.map(
            operator => `${operator}=`
        );
        const report = await analyze(
            [
                ...binaryOperators.map(
                    (operator, index) =>
                        `export function binary${index}(value) { return value ${operator} 1; }`
                ),
                "export function positive(value) { return +value; }",
                "export function negative(value) { return -value; }",
                "export function invert(value) { return ~value; }",
                ...assignmentOperators.map(
                    (operator, index) =>
                        `export function assignment${index}(value) { value ${operator} 2; return value; }`
                ),
                "export function increment(value) { return value++; }",
                "export function decrement(value) { return value--; }"
            ].join("\n")
        );
        const findings = report.findings.filter(
            finding => finding.rule === "numeric-operation"
        );

        const expectedFindings =
            binaryOperators.length + assignmentOperators.length + 5;
        expect(findings).toHaveLength(expectedFindings);
        expect(
            findings.map(
                ({ severity, message, suggestion, parameterIndex }) => ({
                    severity,
                    message,
                    suggestion,
                    parameterIndex
                })
            )
        ).toEqual(
            Array.from({ length: expectedFindings }, () => ({
                severity: "info",
                message:
                    "A function parameter reaches a numeric representation-sensitive operation.",
                suggestion:
                    "Exercise SMI, double, -0, NaN, int32/uint32 boundaries, and overflow where the API accepts them.",
                parameterIndex: 0
            }))
        );
    });

    test("ignores comparisons, constants, and proven string concatenation", async () => {
        const report = await analyze(
            [
                "export function compare(value) { return value < 1; }",
                "export function logical(value) { return !value; }",
                "export function constant() { return 1 + 2; }",
                'export function prefix(value) { return "Expected " + value + "."; }',
                "export function template(value) { return value + ` items`; }",
                'export function append(value) { value += " items"; return value; }'
            ].join("\n")
        );

        expect(
            report.findings.filter(
                finding => finding.rule === "numeric-operation"
            )
        ).toEqual([]);
    });
});
