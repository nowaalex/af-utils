import { describe, expect, test } from "vitest";

import { analyzerFixture } from "../test-fixture.test-utils.js";
import { propertyKeyExperiment } from "./experiment.js";

const analyze = analyzerFixture("property-key");

describe("property key detector", () => {
    test("defines string, index, and symbol key classes", () => {
        const values = propertyKeyExperiment.variants.map((_, index) =>
            propertyKeyExperiment.mutate("1", index)
        );

        expect(values.slice(0, 3)).toEqual(["1", "1", 1]);
        expect(typeof values[3]).toBe("symbol");
    });

    test("constructs every key class from a symbol seed", () => {
        const seed = Symbol("field");
        const values = propertyKeyExperiment.variants.map((_, index) =>
            propertyKeyExperiment.mutate(seed, index)
        );

        expect(values[0]).toBe(seed);
        expect(values.map(value => typeof value)).toEqual([
            "symbol",
            "string",
            "number",
            "symbol"
        ]);
        expect(values[3]).toBe(Symbol.for("check-hot:Symbol(field)"));
    });

    test("preserves exact numeric and non-numeric string key variants", () => {
        expect(
            propertyKeyExperiment.variants.map((_, index) =>
                propertyKeyExperiment.mutate(42, index)
            )
        ).toEqual([42, "42", 42, Symbol.for("check-hot:42")]);
        expect(
            propertyKeyExperiment.variants.map((_, index) =>
                propertyKeyExperiment.mutate("field", index)
            )
        ).toEqual(["field", "field", 0, Symbol.for("check-hot:field")]);
    });

    test("rejects unsupported property-key seeds with an exact explanation", () => {
        for (const value of [undefined, null, true, {}, []]) {
            expect(() => propertyKeyExperiment.mutate(value, 0)).toThrowError(
                "property-key requires a string, number, or symbol seed"
            );
        }
    });

    test("keeps object literals, string keys, and length out of array evidence", async () => {
        const report = await analyze(
            "export function read(record, key, text) { return record[key] + record['field'] + text.length; }"
        );

        expect(
            report.obligations.some(
                obligation => obligation.mutationFamily === "array-elements"
            )
        ).toBe(false);
        expect(
            report.obligations.filter(
                obligation =>
                    obligation.mutationFamily === "property-key" &&
                    obligation.parameterIndex === 1
            )
        ).toHaveLength(1);
        expect(report.candidates[0].metrics.dynamicKeyedAccesses).toBe(1);
    });

    test("reports the exact direct keyed-access diagnostic", async () => {
        const report = await analyze(
            "export function read(record, key) { return record.key + record[key]; }"
        );

        expect(
            report.findings.filter(
                finding => finding.rule === "dynamic-keyed-access"
            )
        ).toEqual([
            expect.objectContaining({
                rule: "dynamic-keyed-access",
                severity: "info",
                message:
                    "The function performs keyed access with a dynamic key, so its inline cache may observe multiple key classes.",
                suggestion:
                    "Exercise the proven key source with string, index, and symbol families when the API accepts them.",
                parameterIndex: 1,
                parameterPath: []
            })
        ]);
    });

    test("distinguishes a dynamic key inside a loop", async () => {
        const report = await analyze(
            "export function readMany(record, keys) { for (const key of keys) record[key]; }"
        );
        const finding = report.findings.find(
            value => value.rule === "dynamic-keyed-access-in-loop"
        );

        expect(finding).toMatchObject({
            severity: "warning",
            message:
                "A loop performs keyed access with a dynamic key; changing key/value shapes can make its inline cache polymorphic or megamorphic.",
            suggestion:
                "Add isolated scenarios for stable and mixed key types, then inspect keyed-access deopts before rewriting the code."
        });
        expect(report.candidates[0].metrics.dynamicKeyedAccesses).toBe(1);
    });
});
