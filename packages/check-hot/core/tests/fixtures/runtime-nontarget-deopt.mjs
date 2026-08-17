const hotIdentity = value => value + 1;
const helperVictim = object => object.value;

const target = {
    id: "hotIdentity",
    annotation: false,
    resolve: state => state.hotIdentity
};

export default {
    name: "non-target guarded deopt control",
    setup: () => ({ hotIdentity, helperVictim }),
    scenarios: [
        {
            id: "helper-transition",
            targets: [target],
            run({ state, invoke, phase, iteration }) {
                if (phase === "stress" && iteration === 0) {
                    const victim = state.helperVictim;
                    /* oxlint-disable no-eval -- This negative control deliberately drives V8 intrinsics in the worker started with allow-natives-syntax. */
                    eval("%PrepareFunctionForOptimization(victim)");
                    victim({ value: 1 });
                    eval("%OptimizeFunctionOnNextCall(victim)");
                    victim({ value: 1 });
                    victim({ value: 1, extra: true });
                    /* oxlint-enable no-eval */
                }
                invoke(target, undefined, [iteration]);
            }
        }
    ]
};
