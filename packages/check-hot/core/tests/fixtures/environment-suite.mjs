import { createModuleSuite } from "../../dist/index.js";
import packageManifest from "../../package.json" with { type: "json" };

export default createModuleSuite({
    name: "worker-environment-fixture",
    environment: { CHECK_HOT_FIXTURE: "worker-only" },
    package: {
        name: packageManifest.name,
        version: packageManifest.version
    },
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
