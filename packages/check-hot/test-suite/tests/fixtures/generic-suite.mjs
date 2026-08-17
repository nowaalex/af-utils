import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { createModuleSuite } from "@af-utils/check-hot";
import testRunner from "../../dist/generic.js";

const runnerSourceSha256 = createHash("sha256")
    .update(readFileSync(new URL("../../dist/generic.js", import.meta.url)))
    .digest("hex");

export default createModuleSuite({
    name: "external-runner-runtime-fixture",
    load: () => import("./generic-module.mjs"),
    package: { name: "runtime-fixture", version: "1.0.0" },
    include: ["map"],
    testRunner,
    probeManifest: {
        runnerId: "generic",
        runnerVersion: testRunner.version,
        runnerSourceSha256,
        runnerPackageTree: {
            sourceSha256: runnerSourceSha256,
            fileCount: 0,
            ignoredRelativeFiles: []
        },
        runnerEntryPackagePath: "dist/generic.js",
        runnerSourceGraph: [
            {
                relativeFile: "dist/generic.js",
                sourceSha256: runnerSourceSha256
            }
        ],
        package: { name: "runtime-fixture", version: "1.0.0" },
        runtime: {
            name: "node",
            version: process.versions.node,
            engine: "v8",
            engineVersion: process.versions.v8
        },
        samples: { map: ["collection-map"] },
        targets: {
            map: {
                sourceSha256:
                    "a5ce0026efdd29e8001e29293d98d5d5c6e4734775420065299aa057c2d910e9"
            }
        },
        coverage: { map: { "collection-map": [] } },
        attempts: [
            {
                functionName: "map",
                label: "collection-map",
                status: "accepted"
            }
        ]
    },
    options: {
        runtimes: ["node"],
        v8Tiers: ["turbofan"],
        modes: ["combined"],
        repetitions: 1,
        warmupIterations: 2_000,
        stressIterations: 200
    }
});
