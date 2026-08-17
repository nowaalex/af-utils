import { describe, expect, test } from "vitest";

import { mergeHotModuleProbeManifests } from "../src/analyzer.js";
import type { HotModuleProbeManifest } from "../src/module-suite.js";

const sourceSha256 = "0".repeat(64);
const baseManifest = {
    runnerId: "fixture",
    runnerVersion: "1.0.0",
    runnerSourceSha256: sourceSha256,
    runnerEntryPackagePath: "runner.js",
    runnerSourceGraph: [{ relativeFile: "runner.js", sourceSha256 }],
    runnerPackageTree: {
        sourceSha256,
        fileCount: 1,
        ignoredRelativeFiles: []
    },
    package: { name: "fixture", version: "1.0.0" },
    runtime: {
        name: "node",
        version: "24.0.0",
        engine: "v8",
        engineVersion: "13.6"
    }
} as const;

const manifest = (name: string): HotModuleProbeManifest => ({
    ...baseManifest,
    samples: { [name]: ["number"] },
    targets: { [name]: { sourceSha256 } },
    coverage: { [name]: { number: [] } },
    attempts: [{ functionName: name, label: "number", status: "accepted" }]
});

describe("multi-entry probe manifests", () => {
    test("merges qualified targets and retains every attempt", () => {
        const merged = mergeHotModuleProbeManifests([
            manifest("hot"),
            manifest("./feature::hot")
        ]);

        expect(merged.samples).toEqual({
            hot: ["number"],
            "./feature::hot": ["number"]
        });
        expect(merged.attempts.map(attempt => attempt.functionName)).toEqual([
            "hot",
            "./feature::hot"
        ]);
    });

    test("rejects collisions and mixed runtime identities", () => {
        expect(() =>
            mergeHotModuleProbeManifests([manifest("hot"), manifest("hot")])
        ).toThrow(/Duplicate probed public target hot/u);
        const otherRuntime = manifest("./feature::hot");
        otherRuntime.runtime = { ...otherRuntime.runtime, version: "25.0.0" };
        expect(() =>
            mergeHotModuleProbeManifests([manifest("hot"), otherRuntime])
        ).toThrow(/different runner, package, or runtime identities/u);
    });
});
