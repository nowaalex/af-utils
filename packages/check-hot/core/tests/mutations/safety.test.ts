import { describe, expect, test } from "vitest";

import {
    applyHotMutation,
    canApplyHotMutation,
    hotMutationVariantLabel,
    hotMutationVariantLabels,
    HotMutationNotApplicableError
} from "../../src/mutations.js";
import {
    assertPlainRecordSeed,
    assertSafeArraySeed
} from "../../src/mutation-safety.js";
import type { HotMutationFamily } from "../../src/types.js";

const increment = (value: number) => value + 1;
const arrayIndexWith = (descriptor: PropertyDescriptor) => {
    const value = [1];
    Object.defineProperty(value, "0", {
        value: 1,
        enumerable: true,
        configurable: true,
        writable: true,
        ...descriptor
    });
    return value;
};

describe("automatic mutation safety", () => {
    test("preserves the public blocked-mutation error identity", () => {
        const error = new HotMutationNotApplicableError("blocked");

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe("HotMutationNotApplicableError");
        expect(error.message).toBe("blocked");
    });

    test.each([
        void 0,
        null,
        true,
        1,
        1n,
        "record",
        Symbol("record"),
        () => 1,
        []
    ])("rejects non-record seed %#", value => {
        expect(() => assertPlainRecordSeed(value, "object-shape")).toThrow(
            "object-shape requires a plain record seed"
        );
    });

    test("rejects each unsafe record descriptor independently", () => {
        const invalidRecords = [
            Object.defineProperty({}, "hidden", {
                value: 1,
                enumerable: false,
                configurable: true,
                writable: true
            }),
            Object.defineProperty({}, "fixed", {
                value: 1,
                enumerable: true,
                configurable: false,
                writable: true
            }),
            Object.defineProperty({}, "readonly", {
                value: 1,
                enumerable: true,
                configurable: true,
                writable: false
            }),
            Object.defineProperty({}, "getter", {
                get: () => 1,
                enumerable: true,
                configurable: true
            }),
            Object.defineProperty({}, "setter", {
                set: (_value: unknown) => {},
                enumerable: true,
                configurable: true
            }),
            { [Symbol("field")]: 1 }
        ];

        for (const value of invalidRecords) {
            expect(() => assertPlainRecordSeed(value, "object-shape")).toThrow(
                /cannot safely clone/u
            );
        }
    });

    test("rejects each unsafe array descriptor and noncanonical index", () => {
        const getter = [1];
        Object.defineProperty(getter, "0", {
            get: () => 1,
            enumerable: true,
            configurable: true
        });
        const setter = [1];
        Object.defineProperty(setter, "0", {
            set: (_value: unknown) => {},
            enumerable: true,
            configurable: true
        });
        const fixedLength = [1];
        Object.defineProperty(fixedLength, "length", { writable: false });
        const withSymbol = [1];
        Object.defineProperty(withSymbol, Symbol("field"), {
            value: 1,
            enumerable: true,
            configurable: true,
            writable: true
        });
        const invalidArrays = [
            arrayIndexWith({ enumerable: false }),
            arrayIndexWith({ configurable: false }),
            arrayIndexWith({ writable: false }),
            getter,
            setter,
            fixedLength,
            withSymbol,
            Object.assign([1], { "01": 1 }),
            Object.assign([1], { "0x": 1 }),
            Object.assign([1], { x0: 1 })
        ];

        for (const value of invalidArrays) {
            expect(() => assertSafeArraySeed(value, "array-elements")).toThrow(
                /cannot safely clone/u
            );
        }
    });

    test("declares the exact core-owned and adapter-owned mutation families", () => {
        const coreOwned = [
            "allocation-pressure",
            "array-elements",
            "callback-identity",
            "control-flow",
            "numeric-representation",
            "object-shape",
            "property-key",
            "prototype-chain"
        ] as const satisfies readonly HotMutationFamily[];
        const adapterOwned = [
            "dynamic-code",
            "return-representation"
        ] as const satisfies readonly HotMutationFamily[];

        expect(coreOwned.map(family => canApplyHotMutation(family))).toEqual(
            coreOwned.map(() => true)
        );
        expect(adapterOwned.map(family => canApplyHotMutation(family))).toEqual(
            [false, false]
        );
        expect(
            adapterOwned.map(family => hotMutationVariantLabels(family))
        ).toEqual(adapterOwned.map(family => [family]));
        for (const family of coreOwned) {
            const variants = hotMutationVariantLabels(family);
            expect(variants.length).toBeGreaterThan(0);
            expect(new Set(variants).size).toBe(variants.length);
            expect(
                variants.map((_, index) =>
                    hotMutationVariantLabel(family, index)
                )
            ).toEqual(variants);
            expect(hotMutationVariantLabel(family, variants.length)).toBe(
                variants[0]
            );
        }
    });

    test.each(["dynamic-code", "return-representation"] as const)(
        "requires an adapter-owned semantic scenario for %s",
        family => {
            expect(() => applyHotMutation([1], 0, family, 0)).toThrow(
                `${family} requires an adapter-owned semantic scenario`
            );
        }
    );

    test.each([-1, 1])(
        "rejects missing top-level argument index %i",
        parameterIndex => {
            expect(() =>
                applyHotMutation(
                    [1],
                    parameterIndex,
                    "numeric-representation",
                    0
                )
            ).toThrow(
                `numeric-representation refers to missing argument ${parameterIndex}`
            );
        }
    );

    test.each(["object-shape", "prototype-chain"] as const)(
        "accepts only plain-record seeds for %s",
        family => {
            expect(() => applyHotMutation([new Date()], 0, family, 0)).toThrow(
                HotMutationNotApplicableError
            );
            expect(() =>
                applyHotMutation(
                    [
                        new (class Model {
                            value = 1;
                        })()
                    ],
                    0,
                    family,
                    0
                )
            ).toThrow(/adapter-owned scenario/u);

            const accessor = Object.defineProperty({}, "value", {
                enumerable: true,
                get: () => 1
            });
            expect(() => applyHotMutation([accessor], 0, family, 0)).toThrow(
                /accessors/u
            );
            expect(() =>
                applyHotMutation([Object.create(null) as object], 0, family, 0)
            ).toThrow(/null-prototype/u);
            expect(() =>
                applyHotMutation(
                    [
                        Object.defineProperty({}, "value", {
                            value: 1,
                            enumerable: true,
                            configurable: false,
                            writable: false
                        })
                    ],
                    0,
                    family,
                    0
                )
            ).toThrow(/readonly/u);
            expect(() =>
                applyHotMutation([{ ["__proto__"]: 1 }], 0, family, 0)
            ).toThrow(/__proto__/u);

            expect(applyHotMutation([{ value: 1 }], 0, family, 0)[0]).toEqual({
                value: 1
            });
        }
    );

    test.each(["array-elements", "allocation-pressure"] as const)(
        "rejects arrays whose observable structure cannot be cloned for %s",
        family => {
            const holey = [1, 2, 3];
            delete holey[1];
            expect(() => applyHotMutation([holey], 0, family, 0)).toThrow(
                /holey seed/u
            );

            const withField = Object.assign([1, 2, 3], { metadata: true });
            expect(() => applyHotMutation([withField], 0, family, 0)).toThrow(
                /extra fields/u
            );

            class Values extends Array<number> {}
            expect(() =>
                applyHotMutation([new Values(1, 2, 3)], 0, family, 0)
            ).toThrow(/ordinary array/u);
            expect(() =>
                applyHotMutation([Object.freeze([1, 2, 3])], 0, family, 0)
            ).toThrow(/constrained elements/u);
        }
    );

    test("uses distinct function sites and at least five object maps", () => {
        const callbacks = Array.from(
            { length: 5 },
            (_, index) =>
                applyHotMutation([increment], 0, "callback-identity", index)[0]
        ) as CallableFunction[];
        expect(new Set(callbacks).size).toBe(5);
        expect(
            new Set(
                callbacks.map(value => Function.prototype.toString.call(value))
            ).size
        ).toBe(5);

        const shapes = Array.from(
            { length: 6 },
            (_, index) =>
                applyHotMutation([{ value: 1 }], 0, "object-shape", index)[0]
        ) as Record<string, unknown>[];
        expect(
            new Set(shapes.map(value => Object.keys(value).join(","))).size
        ).toBe(6);
    });

    test("mutates a destructured leaf without replacing its containing argument", () => {
        const original = { value: 1, stable: true };
        const mutated = applyHotMutation(
            [original],
            0,
            "numeric-representation",
            1,
            ["value"]
        )[0] as typeof original;

        expect(mutated).toEqual({ value: 1.25, stable: true });
        expect(original).toEqual({ value: 1, stable: true });
        expect(() =>
            applyHotMutation(
                [
                    new (class Model {
                        value = 1;
                    })()
                ],
                0,
                "numeric-representation",
                1,
                ["value"]
            )
        ).toThrow(/adapter-owned scenario/u);

        const unsafeParents: unknown[][] = [];
        const holey = [1, 2];
        delete holey[0];
        unsafeParents.push(holey);
        unsafeParents.push(Object.assign([1], { metadata: true }));
        class Values extends Array<number> {}
        unsafeParents.push(new Values(1));
        unsafeParents.push(Object.freeze([1]) as unknown[]);
        for (const parent of unsafeParents) {
            expect(() =>
                applyHotMutation([parent], 0, "numeric-representation", 1, [0])
            ).toThrow(HotMutationNotApplicableError);
        }

        expect(() =>
            applyHotMutation([{ value: 1 }], 0, "numeric-representation", 1, [
                "missing"
            ])
        ).toThrow(
            "numeric-representation destructuring path refers to missing field missing"
        );
        expect(() =>
            applyHotMutation([[1]], 0, "numeric-representation", 1, [1])
        ).toThrow(
            "numeric-representation destructuring path refers to missing array index 1"
        );
        expect(() =>
            applyHotMutation([[1]], 0, "numeric-representation", 1, [-1])
        ).toThrow(
            "numeric-representation destructuring path refers to missing array index -1"
        );
        expect(() =>
            applyHotMutation([[1]], 0, "numeric-representation", 1, ["0"])
        ).toThrow(/plain record seed/u);

        expect(
            applyHotMutation(
                [{ 0: 7, stable: true }],
                0,
                "numeric-representation",
                1,
                [0]
            )[0]
        ).toEqual({ 0: 7.25, stable: true });
        expect(
            applyHotMutation([[7, 8]], 0, "numeric-representation", 1, [0])[0]
        ).toEqual([7.25, 8]);
    });

    test("clones every container along a nested mutation path", () => {
        const leaf = { value: 7 };
        const record = {
            nested: [{ value: 1 }, leaf, { value: 9 }],
            stable: true
        };
        const mutated = applyHotMutation(
            [record],
            0,
            "numeric-representation",
            1,
            ["nested", 1, "value"]
        )[0] as typeof record;

        expect(mutated).toEqual({
            nested: [{ value: 1 }, { value: 7.25 }, { value: 9 }],
            stable: true
        });
        expect(mutated).not.toBe(record);
        expect(mutated.nested).not.toBe(record.nested);
        expect(mutated.nested[0]).toBe(record.nested[0]);
        expect(mutated.nested[1]).not.toBe(leaf);
        expect(mutated.nested[2]).toBe(record.nested[2]);
        expect(record).toEqual({
            nested: [{ value: 1 }, { value: 7 }, { value: 9 }],
            stable: true
        });
    });

    test("keeps the top-level invocation carrier free of its tagging sentinel", () => {
        const original = [7, "stable"] as const;
        const mutated = applyHotMutation(
            original,
            0,
            "numeric-representation",
            1
        );

        expect(mutated).toEqual([7.25, "stable"]);
        expect(mutated).toHaveLength(original.length);
        expect(original).toEqual([7, "stable"]);
    });
});
