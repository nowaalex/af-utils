import type { HotMutationExperiment } from "../../../mutation-experiment.js";
import { assertPlainRecordSeed } from "../../../mutation-safety.js";

/** Hidden-class diversity plan for plain public records. */
export const objectShapeExperiment: HotMutationExperiment = {
    variants: [
        "original-order",
        "extra-field-a",
        "prefixed-field-b",
        "two-extra-fields",
        "missing-field",
        "prefixed-reversed"
    ],
    mutate(value, iteration) {
        assertPlainRecordSeed(value, "object-shape");
        const entries = Object.entries(value);
        switch (iteration % 6) {
            case 0:
                return Object.fromEntries(entries);
            case 1:
                return { ...value, __checkHotShapeA__: 1 };
            case 2:
                return { __checkHotShapeB__: 1, ...value };
            case 3:
                return {
                    ...value,
                    __checkHotShapeA__: 1,
                    __checkHotShapeB__: 2
                };
            case 4:
                return Object.fromEntries(entries.slice(0, -1));
            default:
                return Object.fromEntries([
                    ["__checkHotShapeC__", 1],
                    ...entries.toReversed()
                ]);
        }
    }
};

/** Ordinary/null prototype transition plan for safe plain records. */
export const prototypeChainExperiment: HotMutationExperiment = {
    variants: ["ordinary-prototype", "null-prototype"],
    mutate(value, iteration) {
        assertPlainRecordSeed(value, "prototype-chain");
        if (iteration % 2 === 0) return { ...value };
        return Object.assign(Object.create(null) as object, value);
    }
};
