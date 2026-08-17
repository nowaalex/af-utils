import type { HotMutationExperiment } from "../../../mutation-experiment.js";
import { HotMutationNotApplicableError } from "../../../mutation-safety.js";

/** Stable-SMI to numeric-representation transition plan. */
export const numericRepresentationExperiment: HotMutationExperiment = {
    variants: [
        "seed-number",
        "fractional-double",
        "negative-zero",
        "nan",
        "int32-overflow",
        "uint32-overflow"
    ],
    mutate(value, iteration) {
        if (typeof value !== "number") {
            throw new HotMutationNotApplicableError(
                "numeric-representation requires a number seed"
            );
        }
        switch (iteration % numericRepresentationExperiment.variants.length) {
            case 0:
                return 1;
            case 1:
                return value + 0.25;
            case 2:
                return -0;
            case 3:
                return Number.NaN;
            case 4:
                return 2 ** 31;
            default:
                return 2 ** 32;
        }
    }
};
