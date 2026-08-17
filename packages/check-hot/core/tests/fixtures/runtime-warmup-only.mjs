const hotIdentity = value => value + 1;

const target = {
    id: "hotIdentity",
    annotation: false,
    resolve: state => state.hotIdentity
};

export default {
    name: "warmup-only target control",
    setup: () => ({ hotIdentity }),
    scenarios: [
        {
            id: "warmup-only",
            targets: [target],
            run({ state, invoke, phase, iteration }) {
                if (phase === "warmup") {
                    invoke(target, undefined, [iteration]);
                } else {
                    state.hotIdentity(iteration);
                }
            }
        }
    ]
};
