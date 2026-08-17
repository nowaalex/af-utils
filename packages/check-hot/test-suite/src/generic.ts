import type { HotModuleSample } from "@af-utils/check-hot";

import { createRecipeTestRunner, testRunnerVersion } from "./shared.js";
import type { HotRecipeResolver } from "./shared.js";

const collection = () => [1, 2, 3, 4, 5, 6];
const collectionVariant = (iteration: number) => {
    switch (iteration % 4) {
        case 0:
            return [1, 2, 3, 4];
        case 1:
            return [1.25, 2.5, 3.75];
        case 2:
            return [{ value: 1 }, { value: 2 }];
        default: {
            const holey: unknown[] = [1, 2, 3, 4];
            delete holey[1];
            return holey;
        }
    }
};
const records = () => [
    { id: 1, active: true, nested: { value: 10 } },
    { id: 2, active: false, nested: { value: 20 } },
    { id: 3, active: true, nested: { value: 30 } }
];
const identity = (value: unknown) => value;
const callbacks = [
    identity,
    (value: unknown) => Boolean(value),
    (value: unknown) => [value],
    (value: unknown) => ({ value }),
    (value: unknown) => String(value)
];
const isEven = (value: unknown) => Number(value) % 2 === 0;

const booleanResult = (result: unknown) => {
    if (typeof result !== "boolean") {
        throw new TypeError("predicate recipe must return a boolean");
    }
};

const arrayResult = (result: unknown) => {
    if (!Array.isArray(result)) {
        throw new TypeError("collection recipe must return an array");
    }
};

/** Conservative name-based samples for ordinary utility functions. */
export const resolveGenericRecipes: HotRecipeResolver = candidate => {
    const normalized = candidate.name.toLowerCase();
    if (/^(?:is|has)[a-z]/u.test(candidate.name)) {
        return [
            {
                label: "predicate-number",
                args: () => [42],
                verify: booleanResult
            },
            {
                label: "predicate-object",
                args: () => [{ value: 42 }],
                verify: booleanResult
            }
        ];
    }
    if (/map|flatmap/u.test(normalized)) {
        return [
            {
                label: "collection-map",
                args: iteration => [
                    collectionVariant(iteration),
                    callbacks[iteration % callbacks.length]
                ],
                verify: arrayResult
            }
        ];
    }
    if (/filter|reject/u.test(normalized)) {
        return [
            {
                label: "collection-predicate",
                args: iteration => [
                    collectionVariant(iteration),
                    iteration % 2 === 0 ? isEven : identity
                ],
                verify: arrayResult
            }
        ];
    }
    if (/some|every/u.test(normalized)) {
        return [
            {
                label: "collection-predicate",
                args: () => [collection(), isEven],
                verify: booleanResult
            }
        ];
    }
    if (/find/u.test(normalized)) {
        return [
            {
                label: "collection-predicate",
                args: () => [collection(), isEven],
                verify(result) {
                    if (result !== 2) {
                        throw new TypeError(
                            "find recipe must return the first even value"
                        );
                    }
                }
            }
        ];
    }
    if (/reduce/u.test(normalized)) {
        return [
            {
                label: "collection-reduce",
                args: () => [
                    collection(),
                    (sum: number, value: number) => sum + value,
                    0
                ],
                verify(result) {
                    if (result !== 21) {
                        throw new TypeError("reduce recipe returned wrong sum");
                    }
                }
            }
        ];
    }
    if (/chunk|take|drop|slice/u.test(normalized)) {
        return [
            {
                label: "collection-count",
                args: iteration => [
                    collectionVariant(iteration),
                    iteration % 2 === 0 ? 2 : 2.5
                ],
                verify: arrayResult
            }
        ];
    }
    if (/sort|order/u.test(normalized)) {
        return [
            {
                label: "record-order",
                args: () => [records(), ["id"], ["asc"]],
                verify: arrayResult
            }
        ];
    }
    if (normalized === "property") {
        return [
            {
                label: "property-accessor",
                args: () => ["nested.value"],
                verify(result) {
                    if (typeof result !== "function") {
                        throw new TypeError("property must return an accessor");
                    }
                },
                probeFingerprint({ result }) {
                    return Reflect.apply(
                        result as CallableFunction,
                        undefined,
                        [{ nested: { value: 42 } }]
                    );
                }
            }
        ];
    }
    if (/^(?:get|at)/u.test(normalized)) {
        return [
            {
                label: "nested-property",
                args: iteration => [
                    iteration % 2 === 0
                        ? { nested: { value: 42 }, stable: true }
                        : { stable: true, nested: { value: 42 } },
                    iteration % 2 === 0 ? "nested.value" : "stable",
                    null
                ],
                verify(result) {
                    if (result === undefined) {
                        throw new TypeError(
                            "property lookup unexpectedly returned undefined"
                        );
                    }
                }
            }
        ];
    }
    if (/^(?:set|update)/u.test(normalized)) {
        return [
            {
                label: "fresh-object-write",
                args: iteration => [
                    iteration % 2 === 0
                        ? { nested: { value: 1 }, stable: true }
                        : { stable: true, nested: { value: 1 } },
                    iteration % 2 === 0 ? "nested.value" : "stable",
                    42
                ],
                verify(result) {
                    if (typeof result !== "object" || result === null) {
                        throw new TypeError(
                            "object write recipe must return an object"
                        );
                    }
                }
            }
        ];
    }
    if (/camel|kebab|snake|startcase|lower|upper/u.test(normalized)) {
        return [
            {
                label: "words",
                args: () => ["hello stable JIT world"],
                verify(result) {
                    if (typeof result !== "string") {
                        throw new TypeError(
                            "word transform recipe must return a string"
                        );
                    }
                }
            }
        ];
    }
    const fallback: HotModuleSample = {
        label: "generic-stable-values",
        args: () =>
            [collection(), 2, identity, "value", { value: 1 }, true].slice(
                0,
                Math.max(candidate.fn.length, 1)
            )
    };
    return [fallback];
};

/** Generic opt-in runner for packages without a dedicated adapter. */
const genericTestRunner = createRecipeTestRunner({
    id: "generic",
    version: testRunnerVersion,
    packageRange: "*",
    resolve: resolveGenericRecipes
});

export default genericTestRunner;
