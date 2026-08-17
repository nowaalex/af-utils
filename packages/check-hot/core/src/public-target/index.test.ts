import { describe, expect, test } from "vitest";

import {
    hotObligationTargetId,
    hotPublicTargetId,
    resolveHotPublicFunction
} from "./index.js";

function mentionsClass() {
    return "class Example {}";
}

function callableOwner() {}
const callableOwnerHot = () => 1;

describe("public target identity", () => {
    test("keeps simple root IDs compatible and qualifies every other locator", () => {
        expect(
            hotPublicTargetId({ modulePath: ".", exportPath: ["hot"] })
        ).toBe("hot");
        expect(
            hotPublicTargetId({
                modulePath: "./feature",
                exportPath: ["nested.value", "run/now"]
            })
        ).toBe("./feature::nested.value/run%2Fnow");
        expect(
            hotPublicTargetId({
                modulePath: ".",
                exportPath: ["namespace", "hot"]
            })
        ).toBe(".::namespace/hot");
        expect(
            hotPublicTargetId({
                modulePath: ".",
                exportPath: ["./feature::hot"]
            })
        ).toBe(".::.%2Ffeature%3A%3Ahot");
    });

    test.each([
        {
            target: { modulePath: "", exportPath: ["hot"] },
            message:
                "Public module path must be a non-empty string without NUL bytes"
        },
        {
            target: { modulePath: "bad\u0000path", exportPath: ["hot"] },
            message:
                "Public module path must be a non-empty string without NUL bytes"
        },
        {
            target: { modulePath: ".", exportPath: [] },
            message: "Public export path must contain at least one segment"
        },
        {
            target: { modulePath: ".", exportPath: [""] },
            message:
                "Public export path segment must be a non-empty string without NUL bytes"
        },
        {
            target: { modulePath: ".", exportPath: ["bad\u0000name"] },
            message:
                "Public export path segment must be a non-empty string without NUL bytes"
        }
    ])("rejects malformed locator %#", ({ target, message }) => {
        expect(() => hotPublicTargetId(target)).toThrowError(message);
    });

    test("qualifies a single export from a public subpath", () => {
        expect(
            hotPublicTargetId({
                modulePath: "./feature",
                exportPath: ["hot"]
            })
        ).toBe("./feature::hot");
    });

    test("matches obligations by structured root, subpath, and nested identity", () => {
        expect(
            [
                {
                    exportName: "hot",
                    publicTarget: { modulePath: ".", exportPath: ["hot"] }
                },
                {
                    exportName: "hot",
                    publicTarget: {
                        modulePath: "./feature",
                        exportPath: ["hot"]
                    }
                },
                {
                    exportName: "hot",
                    publicTarget: {
                        modulePath: ".",
                        exportPath: ["namespace", "hot"]
                    }
                }
            ].map(obligation => hotObligationTargetId(obligation))
        ).toEqual(["hot", "./feature::hot", ".::namespace/hot"]);
    });

    test("uses a structured locator before a stale legacy export name", () => {
        expect(
            hotObligationTargetId({
                exportName: "wrong",
                publicTarget: {
                    modulePath: "./feature",
                    exportPath: ["nested", "hot"]
                }
            })
        ).toBe("./feature::nested/hot");
        expect(hotObligationTargetId({ exportName: "legacy" })).toBe("legacy");
        expect(hotObligationTargetId({})).toBeUndefined();
    });

    test("resolves nested own data functions with their exact receiver", () => {
        const owner = { hot() {} };
        const namespace = { feature: owner };

        expect(
            resolveHotPublicFunction(namespace, {
                modulePath: ".",
                exportPath: ["feature", "hot"]
            })
        ).toEqual({ name: "hot", fn: owner.hot, receiver: owner });
    });

    test("does not invoke accessors or accept classes and missing paths", () => {
        let getterCalls = 0;
        const namespace = Object.defineProperty({}, "feature", {
            get() {
                getterCalls++;
                return { hot() {} };
            }
        }) as Record<string, unknown>;

        expect(
            resolveHotPublicFunction(namespace, {
                modulePath: ".",
                exportPath: ["feature", "hot"]
            })
        ).toBeUndefined();
        expect(getterCalls).toBe(0);
        expect(
            resolveHotPublicFunction(
                {
                    Hot: class Hot {
                        value() {
                            return 1;
                        }
                    }
                },
                { modulePath: ".", exportPath: ["Hot"] }
            )
        ).toBeUndefined();
        expect(
            resolveHotPublicFunction(
                {},
                { modulePath: ".", exportPath: ["missing"] }
            )
        ).toBeUndefined();
    });

    test("accepts ordinary functions whose source merely contains the word class", () => {
        expect(
            resolveHotPublicFunction(
                { mentionsClass },
                { modulePath: ".", exportPath: ["mentionsClass"] }
            )
        ).toEqual({
            name: "mentionsClass",
            fn: mentionsClass,
            receiver: expect.any(Object)
        });
    });

    test("supports functions as intermediate and final property owners", () => {
        Object.defineProperty(callableOwner, "hot", {
            value: callableOwnerHot
        });

        expect(
            resolveHotPublicFunction(
                { callableOwner },
                { modulePath: ".", exportPath: ["callableOwner", "hot"] }
            )
        ).toEqual({
            name: "hot",
            fn: callableOwnerHot,
            receiver: callableOwner
        });
        expect(
            resolveHotPublicFunction(callableOwner, {
                modulePath: ".",
                exportPath: ["hot"]
            })
        ).toEqual({
            name: "hot",
            fn: callableOwnerHot,
            receiver: callableOwner
        });
    });

    test.each([
        { label: "null intermediate", namespace: { feature: null } },
        { label: "primitive intermediate", namespace: { feature: 1 } },
        { label: "missing intermediate", namespace: {} }
    ])("rejects $label", ({ namespace }) => {
        expect(
            resolveHotPublicFunction(namespace, {
                modulePath: ".",
                exportPath: ["feature", "hot"]
            })
        ).toBeUndefined();
    });

    test.each([
        { label: "nested null owner", namespace: { feature: null } },
        { label: "nested primitive owner", namespace: { feature: 1 } }
    ])("rejects $label before reading another segment", ({ namespace }) => {
        expect(
            resolveHotPublicFunction(namespace, {
                modulePath: ".",
                exportPath: ["feature", "nested", "hot"]
            })
        ).toBeUndefined();
    });

    test("rejects intermediate accessors and invalid final values", () => {
        const accessorOwner = Object.defineProperty({}, "feature", {
            get: () => ({ hot() {} })
        });
        expect(
            resolveHotPublicFunction(accessorOwner, {
                modulePath: ".",
                exportPath: ["feature", "hot"]
            })
        ).toBeUndefined();

        for (const value of [
            null,
            1,
            "hot",
            {},
            class Hot {
                value = 1;
            }
        ]) {
            expect(
                resolveHotPublicFunction(
                    { value },
                    { modulePath: ".", exportPath: ["value"] }
                )
            ).toBeUndefined();
        }
    });
});
