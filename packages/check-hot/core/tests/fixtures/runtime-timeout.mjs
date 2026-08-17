const spin = () => {
    while (true) {
        // Intentional runtime timeout mutant.
    }
};

const target = {
    id: "spin",
    annotation: false,
    resolve: state => state.spin
};

export default {
    name: "timeout control",
    setup: () => ({ spin }),
    scenarios: [
        {
            id: "never-finishes",
            targets: [target],
            run({ invoke }) {
                invoke(target, null);
            }
        }
    ]
};
