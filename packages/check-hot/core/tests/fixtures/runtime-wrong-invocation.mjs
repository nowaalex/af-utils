const hotIdentity = value => value + 1;

const target = {
    id: "hotIdentity",
    annotation: false,
    resolve: state => state.hotIdentity
};

export default {
    name: "wrong invocation control",
    setup: () => ({ hotIdentity }),
    scenarios: [
        {
            id: "bypasses-invocation-ledger",
            targets: [target],
            run({ state, iteration }) {
                state.hotIdentity(iteration);
            }
        }
    ]
};
