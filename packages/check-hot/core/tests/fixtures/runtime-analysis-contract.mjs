const target = value => value + 1;

export default {
    name: "runtime-analysis-contract",
    analysis: {
        runtime: "node",
        graphComplete: true,
        diagnostics: []
    },
    setup: () => ({ target }),
    scenarios: [
        {
            id: "stable",
            targets: [
                {
                    id: "target",
                    resolve: state => state.target
                }
            ],
            run: ({ state }) => state.target(1)
        }
    ]
};
