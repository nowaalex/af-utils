import type {
    HotModuleMutationVerificationContext,
    HotModuleTestRunnerContext,
    HotPublicFunctionLocator
} from "@af-utils/check-hot";

import type { HotRecipeResolver } from "./shared.js";
import { createRecipeTestRunner, testRunnerVersion } from "./shared.js";

/** Three.js peer range exercised by this adapter. */
export const threePackageRange = ">=0.180 <0.186";

type NumericOperation = (...values: number[]) => number;

interface NumericRecipe {
    args: readonly number[];
    /** Return whether arguments belong to the documented recipe domain. */
    accepts: (...values: number[]) => boolean;
    evaluate: NumericOperation;
}

const recipes = new Map<string, NumericRecipe>([
    [
        "clamp",
        {
            args: [2, -1, 1],
            accepts: (value, minimum, maximum) =>
                [value, minimum, maximum].every(item =>
                    Number.isFinite(item)
                ) && minimum <= maximum,
            evaluate: (value, minimum, maximum) =>
                Math.max(minimum, Math.min(maximum, value))
        }
    ],
    [
        "euclideanmodulo",
        {
            args: [-7, 4],
            accepts: (dividend, divisor) =>
                Number.isFinite(dividend) &&
                Number.isFinite(divisor) &&
                divisor !== 0,
            evaluate: (dividend, divisor) =>
                ((dividend % divisor) + divisor) % divisor
        }
    ],
    [
        "inverselerp",
        {
            args: [2, 10, 6],
            accepts: (start, end, value) =>
                [start, end, value].every(item => Number.isFinite(item)),
            evaluate: (start, end, value) =>
                start !== end ? (value - start) / (end - start) : 0
        }
    ],
    [
        "lerp",
        {
            args: [2, 10, 0.25],
            accepts: (start, end, amount) =>
                [start, end, amount].every(item => Number.isFinite(item)) &&
                amount >= 0 &&
                amount <= 1,
            evaluate: (start, end, amount) =>
                (1 - amount) * start + amount * end
        }
    ],
    [
        "maplinear",
        {
            args: [5, 0, 10, -1, 1],
            accepts: (value, fromStart, fromEnd, toStart, toEnd) =>
                [value, fromStart, fromEnd, toStart, toEnd].every(item =>
                    Number.isFinite(item)
                ) && fromStart !== fromEnd,
            evaluate: (value, fromStart, fromEnd, toStart, toEnd) =>
                toStart +
                ((value - fromStart) * (toEnd - toStart)) /
                    (fromEnd - fromStart)
        }
    ]
]);

const operationName = (candidateName: string) =>
    candidateName.split(/[./]/u).at(-1)?.toLowerCase() ?? "";

const assertNumericResult = (
    operation: NumericRecipe,
    args: readonly unknown[],
    result: unknown
) => {
    if (!args.every(value => typeof value === "number")) {
        throw new TypeError(
            "Three.js MathUtils recipe requires numeric inputs"
        );
    }
    if (!operation.accepts(...(args as number[]))) {
        throw new RangeError(
            "Three.js MathUtils mutation is outside this recipe's semantic domain"
        );
    }
    const expected = operation.evaluate(...(args as number[]));
    if (
        typeof result !== "number" ||
        (!Object.is(result, expected) &&
            !(Number.isNaN(result) && Number.isNaN(expected)))
    ) {
        throw new TypeError(
            `Three.js MathUtils returned ${String(result)}, expected ${String(expected)}`
        );
    }
};

const discoverMathUtils = (
    context: HotModuleTestRunnerContext
): readonly HotPublicFunctionLocator[] => {
    const descriptor = Object.getOwnPropertyDescriptor(
        context.namespace,
        "MathUtils"
    );
    const mathUtils =
        descriptor && "value" in descriptor ? descriptor.value : undefined;
    if (typeof mathUtils !== "object" || mathUtils === null) return [];
    return [...recipes.keys()].flatMap(name => {
        const exportName = Object.keys(mathUtils).find(
            key => key.toLowerCase() === name
        );
        if (!exportName) return [];
        const functionDescriptor = Object.getOwnPropertyDescriptor(
            mathUtils,
            exportName
        );
        const value =
            functionDescriptor && "value" in functionDescriptor
                ? functionDescriptor.value
                : undefined;
        return typeof value === "function"
            ? [
                  {
                      modulePath: ".",
                      exportPath: ["MathUtils", exportName]
                  }
              ]
            : [];
    });
};

const resolveThreeRecipes: HotRecipeResolver = candidate => {
    const operation = recipes.get(operationName(candidate.name));
    if (!operation) return [];
    return [
        {
            label: `math-utils-${operationName(candidate.name)}`,
            args: () => [...operation.args],
            verify(result) {
                assertNumericResult(operation, operation.args, result);
            },
            acceptMutation({ args }) {
                if (
                    args.every(value => typeof value === "number") &&
                    operation.accepts(...(args as number[]))
                ) {
                    return true;
                }
                return "the generated numeric input is outside this MathUtils recipe's documented domain";
            },
            verifyMutation(context: HotModuleMutationVerificationContext) {
                assertNumericResult(operation, context.args, context.result);
            }
        }
    ];
};

/** Numeric MathUtils recipes kept outside the runtime-agnostic core. */
const threeTestRunner = createRecipeTestRunner({
    id: "three-math-utils",
    version: testRunnerVersion,
    packageNames: ["three"],
    packageRange: threePackageRange,
    discover: discoverMathUtils,
    resolve: resolveThreeRecipes
});

export default threeTestRunner;
