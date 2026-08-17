import { describe, expect, test } from "vitest";

import { arrayElementsExperiment } from "../../src/analyzer/rules/array-elements/experiment.js";
import { callbackIdentityExperiment } from "../../src/analyzer/rules/callback-identity/experiment.js";
import {
    allocationPressureExperiment,
    controlFlowExperiment
} from "../../src/analyzer/rules/loop-pressure/experiment.js";
import { numericRepresentationExperiment } from "../../src/analyzer/rules/numeric-representation/experiment.js";
import { propertyKeyExperiment } from "../../src/analyzer/rules/property-key/experiment.js";
import {
    objectShapeExperiment,
    prototypeChainExperiment
} from "../../src/analyzer/rules/shape-mutation/experiment.js";
import { isConcreteValueKind } from "../../src/analyzer/rules/value-kinds.js";

const callbackWithReceiver = function (this: { base: number }, value: number) {
    return this.base + value;
};

describe("mutation experiment contracts", () => {
    test("keeps the exact concrete expression-kind allowlist", () => {
        const concrete = [
            "array",
            "bigint",
            "boolean",
            "function",
            "null",
            "number",
            "object",
            "string"
        ];

        expect(concrete.map(kind => isConcreteValueKind(kind))).toEqual(
            concrete.map(() => true)
        );
        expect(
            ["Identifier", "member", "unknown", "undefined"].map(kind =>
                isConcreteValueKind(kind)
            )
        ).toEqual([false, false, false, false]);
    });

    test("constructs every numeric representation and rejects non-numbers", () => {
        const values = numericRepresentationExperiment.variants.map(
            (_, index) => numericRepresentationExperiment.mutate(7, index)
        );

        expect(values.slice(0, 2)).toEqual([1, 7.25]);
        expect(Object.is(values[2], -0)).toBe(true);
        expect(Number.isNaN(values[3] as number)).toBe(true);
        expect(values.slice(4)).toEqual([2 ** 31, 2 ** 32]);
        expect(() => numericRepresentationExperiment.mutate("7", 0)).toThrow(
            "numeric-representation requires a number seed"
        );
    });

    test("constructs all safe array element layouts", () => {
        const values = arrayElementsExperiment.variants.map(
            (_, index) =>
                arrayElementsExperiment.mutate(
                    ["a", "b", "c"],
                    index
                ) as unknown[]
        );

        expect(values[0]).toEqual([1, 2, 3]);
        expect(values[1]).toEqual([0.25, 1.25, 2.25]);
        expect(values[2]).toEqual([
            { value: "a" },
            { value: "b" },
            { value: "c" }
        ]);
        expect(values[3]).toHaveLength(3);
        expect(1 in values[3]).toBe(false);
        expect(values[4].length).toBe(100_001);
        expect(values[4][100_000]).toBe("a");
    });

    test("constructs distinct stable callback identities with receiver semantics", () => {
        const variants = callbackIdentityExperiment.variants.map((_, index) =>
            callbackIdentityExperiment.mutate(callbackWithReceiver, index)
        ) as ((this: { base: number }, value: number) => number)[];

        expect(new Set(variants).size).toBe(5);
        expect(variants.map(value => value.call({ base: 4 }, 3))).toEqual([
            7, 7, 7, 7, 7
        ]);
        expect(callbackIdentityExperiment.mutate(callbackWithReceiver, 5)).toBe(
            variants[0]
        );
        expect(() => callbackIdentityExperiment.mutate(1, 0)).toThrow(
            "callback-identity requires a function seed"
        );
    });

    test("constructs exact object shape and prototype variants", () => {
        const seed = { first: 1, second: 2 };
        const shapes = objectShapeExperiment.variants.map((_, index) =>
            objectShapeExperiment.mutate(seed, index)
        ) as Record<string, unknown>[];

        expect(Object.keys(shapes[0])).toEqual(["first", "second"]);
        expect(Object.keys(shapes[1])).toEqual([
            "first",
            "second",
            "__checkHotShapeA__"
        ]);
        expect(Object.keys(shapes[2])).toEqual([
            "__checkHotShapeB__",
            "first",
            "second"
        ]);
        expect(Object.keys(shapes[3])).toEqual([
            "first",
            "second",
            "__checkHotShapeA__",
            "__checkHotShapeB__"
        ]);
        expect(shapes[4]).toEqual({ first: 1 });
        expect(Object.keys(shapes[5])).toEqual([
            "__checkHotShapeC__",
            "second",
            "first"
        ]);
        expect(
            Object.getPrototypeOf(prototypeChainExperiment.mutate(seed, 0))
        ).toBe(Object.prototype);
        expect(
            Object.getPrototypeOf(prototypeChainExperiment.mutate(seed, 1))
        ).toBeNull();
    });

    test("preserves key seed identity and emits the other key classes", () => {
        const symbol = Symbol("field");
        const symbolValues = propertyKeyExperiment.variants.map((_, index) =>
            propertyKeyExperiment.mutate(symbol, index)
        );
        const stringValues = propertyKeyExperiment.variants.map((_, index) =>
            propertyKeyExperiment.mutate("field", index)
        );

        expect(symbolValues[0]).toBe(symbol);
        expect(symbolValues.slice(1, 3)).toEqual(["Symbol(field)", 0]);
        expect(typeof symbolValues[3]).toBe("symbol");
        expect(stringValues.slice(0, 3)).toEqual(["field", "field", 0]);
        expect(() => propertyKeyExperiment.mutate({}, 0)).toThrow(
            "property-key requires a string, number, or symbol seed"
        );
    });

    test("expands allocation pressure deterministically", () => {
        const expanded = allocationPressureExperiment.mutate(
            [1, 2],
            0
        ) as number[];

        expect(expanded).toHaveLength(64);
        expect(expanded.slice(0, 8)).toEqual([1, 2, 1, 2, 1, 2, 1, 2]);
    });

    test("preserves then flips boolean and numeric control-flow branches", () => {
        for (const seed of [true, false, 0, 1, 42, -3, -0]) {
            const baseline = controlFlowExperiment.mutate(seed, 0);
            const alternate = controlFlowExperiment.mutate(seed, 1);
            expect(Object.is(baseline, seed)).toBe(true);
            expect(alternate ? "truthy" : "falsy").not.toBe(
                seed ? "truthy" : "falsy"
            );
        }
        expect(() => controlFlowExperiment.mutate("true", 0)).toThrow(
            "control-flow requires a boolean or number seed"
        );
    });
});
