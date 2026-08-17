const hotIdentity = value => value + 1;

const target = {
    id: "hotIdentity",
    annotation: false,
    resolve: state => state.hotIdentity
};

export default {
    name: "runtime pass control",
    setup: () => ({ hotIdentity }),
    scenarios: [
        {
            id: "numbers",
            targets: [target],
            run({ invoke, iteration }) {
                invoke(target, undefined, [iteration]);
            }
        }
    ]
};
