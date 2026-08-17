const hotIdentity = value => value + 1;
const warmupVictim = object => object.value;

const target = {
    id: "hotIdentity",
    annotation: false,
    resolve: state => state.hotIdentity
};

export default {
    name: "warmup deopt control",
    setup: () => ({ hotIdentity, warmupVictim }),
    scenarios: [
        {
            id: "warmup-deopt",
            targets: [target],
            run({ state, invoke, phase, iteration }) {
                if (phase === "warmup" && iteration === 0) {
                    const victim = state.warmupVictim;
                    /* oxlint-disable no-eval -- This negative control deliberately drives V8 intrinsics in the worker started with allow-natives-syntax. */
                    eval("%PrepareFunctionForOptimization(victim)");
                    victim({ value: 1 });
                    eval("%OptimizeFunctionOnNextCall(victim)");
                    victim({ value: 1 });
                    eval("%DeoptimizeFunction(victim)");
                    /* oxlint-enable no-eval */
                }
                invoke(target, undefined, [iteration]);
            }
        }
    ]
};
