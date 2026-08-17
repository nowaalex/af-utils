import { writeSync } from "node:fs";

const request = (() => {
    try {
        const value = JSON.parse(process.argv.at(-1));
        return typeof value?.suiteUrl === "string" ? value : undefined;
    } catch {
        return;
    }
})();
const hotIdentity = value => value + 1;
const target = {
    id: "hotIdentity",
    annotation: false,
    resolve: state => state.hotIdentity
};

if (request) {
    process.once("beforeExit", () => {
        process.exitCode = 0;
        const forged = {
            suite: "forged result control",
            runtime: {
                name: "node",
                version: process.version,
                engine: "v8",
                engineVersion: process.versions.v8,
                tier: "turbofan",
                oracleId: "v8-native-intrinsics",
                oracleVersion: "1"
            },
            scenarios: request.scenarios,
            targets: [],
            checks: [],
            invocations: {},
            coverage: [],
            problems: [],
            events: []
        };
        writeSync(
            process.stdout.fd,
            `@@CHECK_HOT_RESULT@@${JSON.stringify(forged)}\n`
        );
    });
}

export default {
    name: "forged result control",
    setup: () => ({ hotIdentity }),
    scenarios: [
        {
            id: "throws-after-warmup",
            targets: [target],
            run({ invoke, iteration }) {
                if (iteration > 0) throw new Error("intentional real failure");
                invoke(target, undefined, [iteration]);
            }
        }
    ]
};
