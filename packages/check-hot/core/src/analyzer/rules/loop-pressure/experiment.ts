import type { HotMutationExperiment } from "../../../mutation-experiment.js";
import {
    assertSafeArraySeed,
    HotMutationNotApplicableError
} from "../../../mutation-safety.js";

/** Larger collection plan for adapter-owned allocation-pressure claims. */
export const allocationPressureExperiment: HotMutationExperiment = {
    variants: ["expanded-allocation"],
    mutate(value) {
        assertSafeArraySeed(value, "allocation-pressure");
        return Array.from(
            { length: Math.max(value.length * 8, 64) },
            (_, index) => value[index % Math.max(value.length, 1)]
        );
    }
};

/** Boolean/number branch-family transition plan. */
export const controlFlowExperiment: HotMutationExperiment = {
    variants: ["baseline-branch", "alternate-branch"],
    mutate(value, iteration) {
        if (typeof value === "boolean") {
            return iteration % 2 === 0 ? value : !value;
        }
        if (typeof value === "number") {
            return iteration % 2 === 0 ? value : value ? 0 : 1;
        }
        throw new HotMutationNotApplicableError(
            "control-flow requires a boolean or number seed"
        );
    }
};
