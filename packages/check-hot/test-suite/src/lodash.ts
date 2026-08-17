import type { HotRecipeResolver } from "./shared.js";
import { createRecipeTestRunner, testRunnerVersion } from "./shared.js";
import { resolveGenericRecipes } from "./generic.js";

const withVerification = (
    sample: ReturnType<typeof resolveGenericRecipes>[number],
    verify: (result: unknown) => void
) => Object.assign({}, sample, { verify });

/** Lodash peer range covered by this adapter. */
export const lodashPackageRange = ">=4 <5";

const resolveLodashRecipes: HotRecipeResolver = (candidate, context) => {
    if (candidate.name.toLowerCase() === "template") {
        return [
            {
                label: "template-source",
                args: () => ["Hello <%= name %>"],
                verify(result) {
                    if (typeof result !== "function") {
                        throw new TypeError(
                            "Lodash template must compile a function"
                        );
                    }
                },
                probeFingerprint({ result }) {
                    return Reflect.apply(
                        result as CallableFunction,
                        undefined,
                        [{ name: "check-hot" }]
                    );
                }
            }
        ];
    }
    const normalized = candidate.name.toLowerCase();
    if (normalized === "head" || normalized === "first") {
        return [
            {
                label: "array-head",
                args: () => [[1, 2, 3]],
                verifyMutation({ args, result }) {
                    const values = args[0];
                    if (
                        !Array.isArray(values) ||
                        !Object.is(result, values[0])
                    ) {
                        throw new TypeError(
                            `Lodash ${candidate.name} returned a value other than the first mutated array item`
                        );
                    }
                }
            }
        ];
    }
    return resolveGenericRecipes(candidate, context).map(sample => {
        if (
            /map|flatmap|filter|reject|chunk|take|drop|slice|sort|order/u.test(
                normalized
            )
        ) {
            return withVerification(sample, result => {
                if (!Array.isArray(result)) {
                    throw new TypeError(
                        `Lodash ${candidate.name} must return an array for this recipe`
                    );
                }
            });
        }
        if (/^(?:is|has)[a-z]|some|every/u.test(normalized)) {
            return withVerification(sample, result => {
                if (typeof result !== "boolean") {
                    throw new TypeError(
                        `Lodash ${candidate.name} must return a boolean for this recipe`
                    );
                }
            });
        }
        if (/camel|kebab|snake|startcase|lower|upper/u.test(normalized)) {
            return withVerification(sample, result => {
                if (typeof result !== "string") {
                    throw new TypeError(
                        `Lodash ${candidate.name} must return a string for this recipe`
                    );
                }
            });
        }
        return sample;
    });
};

/** Utility recipes declared compatible with the selected Lodash releases. */
const lodashTestRunner = createRecipeTestRunner({
    id: "lodash-public-api",
    version: testRunnerVersion,
    packageNames: ["lodash"],
    packageRange: lodashPackageRange,
    resolve: resolveLodashRecipes
});

export default lodashTestRunner;
