import type { HotMutationExperiment } from "../../../mutation-experiment.js";
import { assertSafeArraySeed } from "../../../mutation-safety.js";

/** Packed/holey/dictionary array transition plan. */
export const arrayElementsExperiment: HotMutationExperiment = {
    variants: [
        "packed-smi",
        "packed-double",
        "packed-object",
        "holey",
        "dictionary"
    ],
    mutate(value, iteration) {
        assertSafeArraySeed(value, "array-elements");
        const length = Math.max(value.length, 3);
        switch (iteration % 5) {
            case 0:
                return Array.from({ length }, (_, index) => index + 1);
            case 1:
                return Array.from({ length }, (_, index) => index + 0.25);
            case 2:
                return Array.from({ length }, (_, index) => ({
                    value: value[index % Math.max(value.length, 1)]
                }));
            case 3: {
                const holey = Array.from(
                    { length },
                    (_, index) => value[index]
                );
                delete holey[Math.floor(length / 2)];
                return holey;
            }
            default: {
                const sparse: unknown[] = [];
                sparse[Math.max(100_000, length * 4)] = value[0];
                return sparse;
            }
        }
    }
};
