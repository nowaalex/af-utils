import { createModuleSuite } from "../../dist/index.js";

export default createModuleSuite({
    name: "worker-environment-fixture",
    environment: { CHECK_HOT_FIXTURE: "worker-only" },
    package: { name: "@af-utils/check-hot", version: "0.1.0" },
    resolve: () => import.meta.resolve("./environment-module.mjs"),
    load: () => import("./environment-module.mjs"),
    samples: {
        readEnvironment: [
            {
                label: "declared-environment",
                args: () => [],
                verify(result) {
                    if (result !== "worker-only") {
                        throw new Error(
                            `Unexpected environment value ${result}`
                        );
                    }
                }
            }
        ]
    },
    options: {
        runtimes: ["node", "deno"],
        v8Tiers: ["turbofan"],
        modes: ["combined"],
        warmupIterations: 100,
        stressIterations: 20
    }
});
