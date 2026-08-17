const hotIdentity = value => value;

const target = {
    id: "hotIdentity",
    annotation: false,
    resolve: state => state.hotIdentity
};

export default {
    name: "wrong representation controls",
    setup: () => ({
        hotIdentity,
        left: { value: 1 },
        right: { value: 1, extra: true },
        values: [1.5, 2.5]
    }),
    scenarios: [
        {
            id: "invoke",
            targets: [target],
            run({ invoke, iteration }) {
                invoke(target, undefined, [iteration]);
            }
        }
    ],
    checks: [
        {
            id: "representation-mutants",
            engines: ["v8"],
            run({ state, engine, expect }) {
                const failures = [];
                if (engine.sameMap(state.left, state.right)) {
                    failures.push("wrong map was accepted");
                } else {
                    failures.push("wrong map detected");
                }
                if (engine.arrayElementsKind(state.values) !== "SMI") {
                    failures.push("wrong elements kind detected");
                }
                expect(false, failures.join("; "));
            }
        }
    ]
};
