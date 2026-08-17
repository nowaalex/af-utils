import { arrayElementsExperiment } from "./analyzer/rules/array-elements/experiment.js";
import { callbackIdentityExperiment } from "./analyzer/rules/callback-identity/experiment.js";
import {
    allocationPressureExperiment,
    controlFlowExperiment
} from "./analyzer/rules/loop-pressure/experiment.js";
import { numericRepresentationExperiment } from "./analyzer/rules/numeric-representation/experiment.js";
import { propertyKeyExperiment } from "./analyzer/rules/property-key/experiment.js";
import {
    objectShapeExperiment,
    prototypeChainExperiment
} from "./analyzer/rules/shape-mutation/experiment.js";
import type { HotMutationExperiment } from "./mutation-experiment.js";
import {
    assertPlainRecordSeed,
    assertSafeArraySeed,
    HotMutationNotApplicableError
} from "./mutation-safety.js";
import type { HotMutationFamily } from "./types.js";

export { HotMutationNotApplicableError } from "./mutation-safety.js";

const mutationExperiments: Partial<
    Record<HotMutationFamily, HotMutationExperiment>
> = {
    "allocation-pressure": allocationPressureExperiment,
    "array-elements": arrayElementsExperiment,
    "callback-identity": callbackIdentityExperiment,
    "control-flow": controlFlowExperiment,
    "numeric-representation": numericRepresentationExperiment,
    "object-shape": objectShapeExperiment,
    "property-key": propertyKeyExperiment,
    "prototype-chain": prototypeChainExperiment
};

/** Whether the thick core has a deterministic mutator for a family. */
export const canApplyHotMutation = (family: HotMutationFamily) =>
    mutationExperiments[family] !== undefined;

/** Complete ordered contract for one deterministic mutation family. */
export const hotMutationVariantLabels = (family: HotMutationFamily) =>
    mutationExperiments[family]?.variants ?? [family];

/** Stable label for one deterministic stress variant. */
export const hotMutationVariantLabel = (
    family: HotMutationFamily,
    iteration: number
) => {
    const familyVariants = hotMutationVariantLabels(family);
    return familyVariants[iteration % familyVariants.length];
};

const mutateValue = (
    value: unknown,
    family: HotMutationFamily,
    iteration: number
) => {
    const experiment = mutationExperiments[family];
    if (!experiment) {
        throw new HotMutationNotApplicableError(
            `${family} requires an adapter-owned semantic scenario`
        );
    }
    return experiment.mutate(value, iteration);
};

/** Apply one deterministic family variant to a semantically valid seed. */
export const applyHotMutation = (
    args: readonly unknown[],
    parameterIndex: number,
    family: HotMutationFamily,
    iteration: number,
    parameterPath: readonly (string | number)[] = []
) => {
    if (parameterIndex < 0 || parameterIndex >= args.length) {
        throw new HotMutationNotApplicableError(
            `${family} refers to missing argument ${parameterIndex}`
        );
    }
    // Keep the invocation carrier in tagged-elements mode. Otherwise V8 may
    // generalize this allocation site to PACKED_DOUBLE_ELEMENTS after the
    // first fractional variant and box a later literal `1` as a HeapNumber.
    // That would make the core claim it constructed an SMI while passing a
    // heap number to the target.
    const mutated = [...args, mutationExperiments];
    mutated.length = args.length;
    const replaceAtPath = (current: unknown, pathIndex: number): unknown => {
        if (pathIndex === parameterPath.length) {
            return mutateValue(current, family, iteration);
        }
        const key = parameterPath[pathIndex];
        if (Array.isArray(current) && typeof key === "number") {
            assertSafeArraySeed(current, family);
            if (key < 0 || key >= current.length) {
                throw new HotMutationNotApplicableError(
                    `${family} destructuring path refers to missing array index ${key}`
                );
            }
            const copy = [...current];
            copy[key] = replaceAtPath(current[key], pathIndex + 1);
            return copy;
        }
        assertPlainRecordSeed(current, family);
        if (!Object.hasOwn(current, key)) {
            throw new HotMutationNotApplicableError(
                `${family} destructuring path refers to missing field ${String(key)}`
            );
        }
        const copy = Object.assign(
            Object.create(Object.getPrototypeOf(current)) as Record<
                PropertyKey,
                unknown
            >,
            current
        );
        copy[key] = replaceAtPath(current[key], pathIndex + 1);
        return copy;
    };
    mutated[parameterIndex] = replaceAtPath(mutated[parameterIndex], 0);
    return mutated;
};
