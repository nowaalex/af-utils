const hotIdentity = value => value + 1;

const target = {
    id: "hotIdentity",
    annotation: false,
    resolve: state => state.hotIdentity
};

export default {
    name: "incomplete graph control",
    analysis: {
        graphComplete: false,
        diagnostics: ["fixture has one unresolved edge"]
    },
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
