const identity = value => value;

const target = {
    id: "identity",
    annotation: false,
    resolve: state => state.identity
};

export default {
    name: "runtime diagnostic crash control",
    setup() {
        const argument = process.argv.at(-1);
        if (argument) {
            const request = JSON.parse(argument);
            if (request.purpose === "diagnostic") {
                throw new Error("intentional diagnostic-only crash");
            }
        }
        return { identity };
    },
    scenarios: [
        {
            id: "identity",
            targets: [target],
            run({ invoke, iteration }) {
                invoke(target, undefined, [iteration]);
            }
        }
    ]
};
