import type { HotMutationExperiment } from "../../../mutation-experiment.js";
import { HotMutationNotApplicableError } from "../../../mutation-safety.js";

const callbackPools = new WeakMap<
    CallableFunction,
    readonly CallableFunction[]
>();

const callbackFactories = [
    (value: CallableFunction) =>
        function callbackVariant0(this: unknown, ...args: unknown[]) {
            return Reflect.apply(value, this, args);
        },
    (value: CallableFunction) =>
        function callbackVariant1(this: unknown, ...args: unknown[]) {
            return Reflect.apply(value, this, args);
        },
    (value: CallableFunction) =>
        function callbackVariant2(this: unknown, ...args: unknown[]) {
            return Reflect.apply(value, this, args);
        },
    (value: CallableFunction) =>
        function callbackVariant3(this: unknown, ...args: unknown[]) {
            return Reflect.apply(value, this, args);
        },
    (value: CallableFunction) =>
        function callbackVariant4(this: unknown, ...args: unknown[]) {
            return Reflect.apply(value, this, args);
        }
] as const;

/** Stable-to-megamorphic callback-identity transition plan. */
export const callbackIdentityExperiment: HotMutationExperiment = {
    variants: [
        "callback-0",
        "callback-1",
        "callback-2",
        "callback-3",
        "callback-4"
    ],
    mutate(value, iteration) {
        if (typeof value !== "function") {
            throw new HotMutationNotApplicableError(
                "callback-identity requires a function seed"
            );
        }
        let pool = callbackPools.get(value);
        if (!pool) {
            pool = callbackFactories.map(factory => factory(value));
            callbackPools.set(value, pool);
        }
        return pool[iteration % pool.length];
    }
};
