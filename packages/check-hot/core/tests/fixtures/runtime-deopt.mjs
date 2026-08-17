const readValue = object => object.value;

const target = {
    id: "readValue",
    annotation: false,
    resolve: state => state.readValue
};

export default {
    name: "guarded deopt control",
    setup: () => ({ readValue }),
    scenarios: [
        {
            id: "late-map-transition",
            targets: [target],
            warmupIterations: 1_000,
            stressIterations: 30,
            run({ invoke, phase, iteration }) {
                const object =
                    phase === "warmup" || iteration === 0
                        ? { value: iteration }
                        : iteration % 2 === 0
                          ? { value: iteration }
                          : { value: iteration, extra: true };
                invoke(target, undefined, [object]);
            }
        }
    ]
};
