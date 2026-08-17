import { describe, expect, test } from "vitest";

import { analyzerFixture } from "../test-fixture.test-utils.js";
import {
    allocationPressureExperiment,
    controlFlowExperiment
} from "./experiment.js";
import { loopTypes } from "./detector.js";

const analyze = analyzerFixture("loop-pressure");

describe("loop pressure detector", () => {
    test("keeps feature-local allocation and branch mutation plans", () => {
        expect(
            (allocationPressureExperiment.mutate([1, 2], 0) as unknown[]).length
        ).toBe(64);
        expect(controlFlowExperiment.mutate(true, 0)).toBe(true);
        expect(controlFlowExperiment.mutate(true, 1)).toBe(false);
    });

    test("expands allocation pressure by cycling the original values", () => {
        const expanded = allocationPressureExperiment.mutate(
            [
                "first",
                "second",
                "third",
                "fourth",
                "fifth",
                "sixth",
                "seventh",
                "eighth",
                "ninth"
            ],
            0
        ) as unknown[];

        expect(expanded).toHaveLength(72);
        expect(expanded.slice(0, 12)).toEqual([
            "first",
            "second",
            "third",
            "fourth",
            "fifth",
            "sixth",
            "seventh",
            "eighth",
            "ninth",
            "first",
            "second",
            "third"
        ]);
        expect(() => allocationPressureExperiment.mutate({}, 0)).toThrowError(
            "allocation-pressure requires an ordinary array seed"
        );
    });

    test("alternates boolean and numeric control flow for every iteration parity", () => {
        expect(
            [0, 1, 2, 3].map(iteration =>
                controlFlowExperiment.mutate(true, iteration)
            )
        ).toEqual([true, false, true, false]);
        expect(
            [0, 1, 2, 3].map(iteration =>
                controlFlowExperiment.mutate(42, iteration)
            )
        ).toEqual([42, 0, 42, 0]);
        expect(() => controlFlowExperiment.mutate("true", 0)).toThrowError(
            "control-flow requires a boolean or number seed"
        );
    });

    test.each([0, 1, 42, -3, -0])(
        "preserves numeric seed %s as baseline and flips its branch",
        seed => {
            const baseline = controlFlowExperiment.mutate(seed, 0);
            const alternate = controlFlowExperiment.mutate(seed, 1);

            expect(Object.is(baseline, seed)).toBe(true);
            expect(alternate ? "truthy" : "falsy").not.toBe(
                seed ? "truthy" : "falsy"
            );
        }
    );

    test("counts allocations and exceptional control flow in a loop", async () => {
        const report = await analyze(
            "export function hot(values) { for (const value of values) { try { ({ value }); } catch {} } }"
        );
        const rules = report.findings.map(finding => finding.rule);

        expect(rules).toContain("allocation-in-loop");
        expect(rules).toContain("control-flow-in-loop");
    });

    test("keeps the exact loop-node allowlist", () => {
        expect([...loopTypes]).toEqual([
            "DoWhileStatement",
            "ForInStatement",
            "ForOfStatement",
            "ForStatement",
            "WhileStatement"
        ]);
    });

    test("counts every allocation shape only while inside a loop", async () => {
        const report = await analyze(`
            export function hot(values) {
                [];
                for (const value of values) {
                    [];
                    ({});
                    new Date(value);
                    (() => value);
                    (function () { return value; });
                    [...values];
                }
            }
        `);
        const finding = report.findings.find(
            value => value.rule === "allocation-in-loop"
        );

        expect(report.candidates[0].metrics.allocationsInLoops).toBe(7);
        expect(finding).toMatchObject({
            severity: "warning",
            message: "7 allocation-shaped expression(s) occur inside loops.",
            suggestion:
                "Profile allocation and GC before changing code; add a large-input stress scenario to make the cost visible."
        });
    });

    test("uses info severity for a single loop allocation", async () => {
        const report = await analyze(
            "export function hot(values) { for (const value of values) ({ value }); }"
        );

        expect(
            report.findings.find(
                finding => finding.rule === "allocation-in-loop"
            )
        ).toMatchObject({
            severity: "info",
            message: "1 allocation-shaped expression(s) occur inside loops."
        });
    });

    test.each([
        [
            "AwaitExpression",
            "export async function hot(values) { for (const value of values) await value; }"
        ],
        [
            "YieldExpression",
            "export function* hot(values) { for (const value of values) yield value; }"
        ],
        [
            "TryStatement",
            "export function hot(values) { for (const value of values) try { value; } catch {} }"
        ]
    ])("reports exact %s loop control-flow guidance", async (kind, source) => {
        const report = await analyze(source);
        const finding = report.findings.find(
            value => value.rule === "control-flow-in-loop"
        );

        expect(finding).toMatchObject({
            severity: "warning",
            message: `${kind} appears inside a loop and may dominate allocation or exception costs.`,
            suggestion:
                "Measure this branch separately from the synchronous fast path and include both success and failure scenarios."
        });
    });
});
