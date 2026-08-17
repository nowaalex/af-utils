import type { HotMutationExperiment } from "../../../mutation-experiment.js";
import { HotMutationNotApplicableError } from "../../../mutation-safety.js";

/** String/index/symbol key-class transition plan. */
export const propertyKeyExperiment: HotMutationExperiment = {
    variants: ["seed-key", "string-key", "index-key", "symbol-key"],
    mutate(value, iteration) {
        if (
            typeof value !== "string" &&
            typeof value !== "number" &&
            typeof value !== "symbol"
        ) {
            throw new HotMutationNotApplicableError(
                "property-key requires a string, number, or symbol seed"
            );
        }
        const numericKey =
            typeof value === "symbol"
                ? 0
                : Number.isNaN(Number(value))
                  ? 0
                  : Number(value);
        const variants: readonly PropertyKey[] = [
            value,
            String(value),
            numericKey,
            Symbol.for(`check-hot:${String(value)}`)
        ];
        return variants[iteration % variants.length];
    }
};
