import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, test } from "vitest";

import { analyzeHotModule } from "../src/analyzer.js";
import {
    createModuleSuite,
    discoverModuleFunctions,
    loadHotTestRunner,
    resolveRunnerFunctionLocators,
    selectModuleFunctions
} from "../src/module-suite.js";
import type {
    HotModuleProbeManifest,
    HotModuleTestRunner
} from "../src/module-suite.js";
import { collectHotTargets } from "../src/worker-shared.js";

const fixtureSourceSha256 = "0".repeat(64);
const fixturePackageTree = {
    sourceSha256: fixtureSourceSha256,
    fileCount: 0,
    ignoredRelativeFiles: []
} as const;
const fixtureRunnerSourceGraph = [
    { relativeFile: "runner.js", sourceSha256: fixtureSourceSha256 }
] as const;
const rootHot = () => "root";
const featureHot = () => "feature";
const nestedTwice = (value: number) => value * 2;
const probeManifest: HotModuleProbeManifest = {
    runnerId: "fixture-runner",
    runnerVersion: "1.0.0",
    runnerSourceSha256: fixtureSourceSha256,
    runnerPackageTree: fixturePackageTree,
    runnerEntryPackagePath: "runner.js",
    runnerSourceGraph: fixtureRunnerSourceGraph,
    package: { name: "fixture", version: "2.0.0" },
    runtime: {
        name: "node",
        version: "26.0.0",
        engine: "v8",
        engineVersion: "14.1.0"
    },
    samples: { map: ["numbers"] },
    targets: { map: { sourceSha256: fixtureSourceSha256 } },
    coverage: { map: { numbers: [] } },
    attempts: [{ functionName: "map", label: "numbers", status: "accepted" }]
};

const fixtureRunner: HotModuleTestRunner = {
    id: "fixture-runner",
    version: "1.0.0",
    coveragePolicy: "seed-only",
    validate: () => [],
    listSamples: () => ({ map: ["numbers"] }),
    createSamples: (_context, selected) => ({
        map: selected.map?.includes("numbers")
            ? [
                  {
                      label: "numbers",
                      args: () => [[1, 2, 3], (value: number) => value * 2]
                  }
              ]
            : []
    })
};

describe("low-code module suite", () => {
    test("discovers data functions without invoking exported accessors", () => {
        let getterCalls = 0;
        const namespace = Object.defineProperties(
            { hot: rootHot },
            {
                unsafe: {
                    enumerable: true,
                    get() {
                        getterCalls++;
                        return featureHot;
                    }
                },
                default: {
                    enumerable: true,
                    get() {
                        getterCalls++;
                        return { nested: featureHot };
                    }
                }
            }
        );

        expect([...discoverModuleFunctions(namespace)]).toEqual([
            ["hot", { name: "hot", fn: rootHot, receiver: namespace }]
        ]);
        expect(getterCalls).toBe(0);
    });

    test("selects nested functions by display name and rejects ambiguity", () => {
        const functions = new Map([
            [
                ".::utilities/twice",
                {
                    name: "utilities.twice",
                    fn: nestedTwice,
                    receiver: null
                }
            ],
            [
                "./feature::twice",
                { name: "twice", fn: nestedTwice, receiver: null }
            ],
            [
                "./other::twice",
                { name: "twice", fn: nestedTwice, receiver: null }
            ]
        ]);

        expect([
            ...selectModuleFunctions(functions, ["utilities.twice"]).keys()
        ]).toEqual([".::utilities/twice"]);
        expect(() => selectModuleFunctions(functions, ["twice"])).toThrow(
            "ambiguous"
        );
        expect(() => selectModuleFunctions(functions, ["missing"])).toThrow(
            "absent"
        );
    });

    test("keeps same-named root and public-subpath functions distinct", async () => {
        const suite = createModuleSuite({
            name: "multi-entry",
            modules: [
                {
                    modulePath: ".",
                    load: () => Promise.resolve({ hot: rootHot })
                },
                {
                    modulePath: "./feature",
                    load: () => Promise.resolve({ hot: featureHot })
                }
            ],
            publicTargets: [
                { modulePath: ".", exportPath: ["hot"] },
                { modulePath: "./feature", exportPath: ["hot"] }
            ],
            samples: {
                hot: [{ label: "root", args: () => [] }],
                "./feature::hot": [{ label: "feature", args: () => [] }]
            }
        });

        const state = await suite.setup({
            inspect: false,
            scenarios: ["hot:root", "./feature::hot:feature"],
            preflightOutcomes: [],
            runtime: {
                name: "node",
                version: process.versions.node,
                engine: "v8",
                engineVersion: process.versions.v8,
                tier: "turbofan",
                oracleId: "v8-native-intrinsics",
                oracleVersion: "1"
            }
        });

        expect(state.functions.get("hot")?.fn).toBe(rootHot);
        expect(state.functions.get("./feature::hot")?.fn).toBe(featureHot);
        expect(state.functions.get("./feature::hot")?.name).toBe("hot");
    });

    test("preserves analysis runtime and loader metadata for the orchestrator", () => {
        const analysis = {
            runtime: "node" as const,
            graphComplete: true,
            diagnostics: [] as const,
            sourceLoader: "tsx" as const
        };
        const suite = createModuleSuite({
            name: "analysis-contract",
            analysis,
            load: () => Promise.resolve({ value: () => 1 }),
            samples: { value: [{ label: "call", args: () => [] }] }
        });

        expect(suite.analysis).toBe(analysis);
    });

    test("rejects an analyzed entry artifact changed before worker setup", async () => {
        let loads = 0;
        const suite = createModuleSuite({
            name: "entry-identity",
            analysis: {
                runtime: "node",
                entrySourceSha256: fixtureSourceSha256,
                graphComplete: true,
                diagnostics: []
            },
            resolve: () => new URL("../src/index.ts", import.meta.url).href,
            load: () => {
                loads++;
                return Promise.resolve({ value: () => 1 });
            },
            samples: { value: [{ label: "call", args: () => [] }] }
        });

        await expect(
            suite.setup({
                inspect: false,
                scenarios: ["value:call"],
                preflightOutcomes: [],
                runtime: {
                    name: "node",
                    version: process.versions.node,
                    engine: "v8",
                    engineVersion: process.versions.v8,
                    tier: "turbofan",
                    oracleId: "v8-native-intrinsics",
                    oracleVersion: "1"
                }
            })
        ).rejects.toThrow(/Analyzed module entry changed/u);
        expect(loads).toBe(0);
    });

    test("rejects resolver-sensitive files added after analysis before target load", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-tree-"));
        let loads = 0;
        try {
            await writeFile(
                join(directory, "package.json"),
                JSON.stringify({ name: "tree-fixture", version: "1.0.0" })
            );
            await writeFile(
                join(directory, "index.js"),
                'export { hot } from "./dependency";'
            );
            await writeFile(
                join(directory, "dependency.js"),
                "export const hot = value => value + 1;"
            );
            const report = await analyzeHotModule({
                input: join(directory, "index.js"),
                runtime: "bun"
            });
            const suite = createModuleSuite({
                name: "tree-fixture",
                analysis: {
                    runtime: report.runtime,
                    entrySourceSha256: report.entrySourceSha256,
                    entryPackagePath: report.entryPackagePath,
                    sourceGraph: report.sourceGraph,
                    packageTree: report.packageTree,
                    graphComplete: report.graphComplete,
                    diagnostics: report.diagnostics
                },
                package: { name: "tree-fixture", version: "1.0.0" },
                resolve: () => pathToFileURL(report.entry).href,
                load: () => {
                    loads++;
                    return Promise.resolve({ hot: (value: number) => value });
                },
                samples: {
                    hot: [{ label: "number", args: () => [1] }]
                }
            });
            await writeFile(
                join(directory, "dependency.ts"),
                "export const hot = (value: number) => value * 2;"
            );

            await expect(
                suite.setup({
                    inspect: false,
                    scenarios: ["hot:number"],
                    preflightOutcomes: [],
                    runtime: {
                        name: "bun",
                        version: "1.3.14",
                        engine: "jsc",
                        engineVersion: "unknown",
                        tier: "jsc",
                        oracleId: "bun-jsc-public-api",
                        oracleVersion: "1"
                    }
                })
            ).rejects.toThrow(/package tree changed/u);
            expect(loads).toBe(0);
        } finally {
            await rm(directory, { force: true, recursive: true });
        }
    });

    test("rejects a changed transitive JSON asset before importing a test runner", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-runner-"));
        try {
            await writeFile(
                join(directory, "package.json"),
                JSON.stringify({
                    name: "runner-graph-fixture",
                    version: "1.0.0",
                    type: "module"
                })
            );
            const runner = join(directory, "runner.js");
            const recipes = join(directory, "recipes.json");
            await writeFile(
                runner,
                [
                    'import recipes from "./recipes.json" with { type: "json" };',
                    "export default {",
                    '  id: "fixture", version: "1.0.0", coveragePolicy: "seed-only",',
                    "  validate: () => [], listSamples: () => recipes, createSamples: () => ({})",
                    "};"
                ].join("\n")
            );
            await writeFile(recipes, JSON.stringify({ hot: ["number"] }));
            const report = await analyzeHotModule({ input: runner });
            await writeFile(recipes, JSON.stringify({ hot: ["changed"] }));

            await expect(
                loadHotTestRunner(
                    pathToFileURL(runner),
                    report.entrySourceSha256,
                    report.packageTree,
                    report.entryPackagePath,
                    report.sourceGraph
                )
            ).rejects.toThrow(/source graph changed/u);
        } finally {
            await rm(directory, { force: true, recursive: true });
        }
    });

    test("discovers ESM and flattened CJS exports without package recipes", async () => {
        const suite = await createModuleSuite({
            name: "fixture",
            load: () =>
                Promise.resolve({
                    map: (
                        values: unknown[],
                        callback: (value: unknown) => unknown
                    ) => values.map(value => callback(value)),
                    Value: class {
                        value = 1;
                    },
                    default: Object.assign(() => "wrapper", {
                        filter: (
                            values: unknown[],
                            predicate: (value: unknown) => boolean
                        ) => values.filter(value => predicate(value))
                    })
                }),
            samples: {
                default: [{ label: "call", args: () => [] }],
                filter: [
                    {
                        label: "predicate",
                        args: () => [[1, 2], (value: number) => value > 1]
                    }
                ],
                map: [
                    {
                        label: "callback",
                        args: () => [[1, 2], (value: number) => value * 2]
                    }
                ]
            }
        });

        expect(suite.targets).toBeUndefined();
        expect(suite.scenarios.map(scenario => scenario.id)).toEqual([
            "default:call",
            "filter:predicate",
            "map:callback"
        ]);
        expect([...collectHotTargets(suite).keys()]).toEqual([
            "default",
            "filter",
            "map"
        ]);
    });

    test("does not execute explicit samples during suite construction", async () => {
        let calls = 0;
        let loads = 0;
        const environmentBefore = process.env.CHECK_HOT_LAZY_TEST;
        const suite = await createModuleSuite({
            name: "explicit",
            environment: { CHECK_HOT_LAZY_TEST: "worker-only" },
            load: () => {
                loads++;
                return Promise.resolve({
                    value: (input: number) => {
                        calls++;
                        return input;
                    }
                });
            },
            samples: {
                value: [{ label: "number", args: () => [42] }]
            }
        });

        expect(calls).toBe(0);
        expect(loads).toBe(0);
        expect(process.env.CHECK_HOT_LAZY_TEST).toBe(environmentBefore);
        expect(suite.scenarios[0].id).toBe("value:number");
        await suite.setup({
            inspect: false,
            scenarios: ["value:number"],
            preflightOutcomes: [],
            runtime: {
                name: "node",
                version: "26.0.0",
                engine: "v8",
                engineVersion: "14.1.0",
                tier: "turbofan",
                oracleId: "v8-native-intrinsics",
                oracleVersion: "1"
            }
        });
        expect(loads).toBe(1);
        expect(calls).toBe(0);
    });

    test("replays only a versioned external-runner probe manifest", async () => {
        let calls = 0;
        const suite = await createModuleSuite({
            name: "runner",
            load: () =>
                Promise.resolve({
                    map: (
                        values: unknown[],
                        callback: (value: unknown) => unknown
                    ) => {
                        calls++;
                        return values.map(value => callback(value));
                    }
                }),
            package: { name: "fixture", version: "2.0.0" },
            testRunner: fixtureRunner,
            probeManifest
        });

        expect(calls).toBe(0);
        expect(suite.scenarios[0].id).toBe("map:numbers");
    });

    test("rejects a runtime target whose source changed after probe", async () => {
        const suite = createModuleSuite({
            name: "changed-target",
            load: () => Promise.resolve({ map: () => 1 }),
            package: { name: "fixture", version: "2.0.0" },
            testRunner: fixtureRunner,
            probeManifest
        });

        await expect(
            suite.setup({
                inspect: false,
                scenarios: ["map:numbers"],
                preflightOutcomes: [],
                runtime: {
                    name: "node",
                    version: "26.0.0",
                    engine: "v8",
                    engineVersion: "14.1.0",
                    tier: "turbofan",
                    oracleId: "v8-native-intrinsics",
                    oracleVersion: "1"
                }
            })
        ).rejects.toThrow(/target map source identity changed/u);
    });

    test("rejects stale runner and package versions", () => {
        expect(() =>
            createModuleSuite({
                name: "stale",
                load: () => Promise.resolve({ map: () => {} }),
                package: { name: "fixture", version: "3.0.0" },
                testRunner: fixtureRunner,
                probeManifest
            })
        ).toThrow("does not match fixture@3.0.0");
    });

    test("rejects malformed or silently incomplete probe manifests", () => {
        expect(() =>
            createModuleSuite({
                name: "missing-attempt",
                load: () => Promise.resolve({ map: () => {} }),
                package: { name: "fixture", version: "2.0.0" },
                testRunner: fixtureRunner,
                probeManifest: { ...probeManifest, attempts: [] }
            })
        ).toThrow("without one accepted terminal attempt");

        expect(() =>
            createModuleSuite({
                name: "coverage-for-rejected",
                load: () => Promise.resolve({ map: () => {} }),
                package: { name: "fixture", version: "2.0.0" },
                testRunner: fixtureRunner,
                probeManifest: {
                    ...probeManifest,
                    coverage: {
                        map: { numbers: [], rejected: [] }
                    }
                }
            })
        ).toThrow("coverage refers to unaccepted sample map:rejected");
    });

    test("lets an external runner discover nested public functions", async () => {
        const nestedRunner: HotModuleTestRunner = {
            id: "nested",
            version: "1.0.0",
            coveragePolicy: "seed-only",
            discover() {
                return [
                    {
                        modulePath: ".",
                        exportPath: ["utilities", "twice"]
                    }
                ];
            },
            validate: () => [],
            listSamples: () => ({ ".::utilities/twice": ["number"] }),
            createSamples: () => ({
                ".::utilities/twice": [{ label: "number", args: () => [21] }]
            })
        };
        const suite = await createModuleSuite({
            name: "nested",
            load: () =>
                Promise.resolve({
                    utilities: { twice: (value: number) => value * 2 }
                }),
            package: { name: "fixture", version: "1.0.0" },
            testRunner: nestedRunner,
            probeManifest: {
                runnerId: "nested",
                runnerVersion: "1.0.0",
                runnerSourceSha256: fixtureSourceSha256,
                runnerPackageTree: fixturePackageTree,
                runnerEntryPackagePath: "runner.js",
                runnerSourceGraph: fixtureRunnerSourceGraph,
                package: { name: "fixture", version: "1.0.0" },
                runtime: probeManifest.runtime,
                samples: { ".::utilities/twice": ["number"] },
                targets: {
                    ".::utilities/twice": {
                        sourceSha256: fixtureSourceSha256
                    }
                },
                coverage: { ".::utilities/twice": { number: [] } },
                attempts: [
                    {
                        functionName: ".::utilities/twice",
                        label: "number",
                        status: "accepted"
                    }
                ]
            }
        });

        expect(suite.scenarios[0].id).toBe(".::utilities/twice:number");
        expect([...collectHotTargets(suite).keys()]).toEqual([
            ".::utilities/twice"
        ]);
    });

    test("resolves adapter locators in core without invoking accessors", () => {
        const utilities = { twice: nestedTwice };
        let getterCalls = 0;
        const namespace = {
            utilities,
            get secret() {
                getterCalls++;
                return nestedTwice;
            }
        };
        const context = {
            namespace,
            functions: discoverModuleFunctions(namespace),
            package: { name: "fixture", version: "1.0.0" },
            runtime: {
                name: "node" as const,
                version: process.versions.node,
                engine: "v8" as const,
                engineVersion: process.versions.v8
            }
        };
        const runner = {
            id: "locator",
            version: "1.0.0",
            coveragePolicy: "seed-only" as const,
            discover: () => [
                { modulePath: ".", exportPath: ["utilities", "twice"] }
            ],
            validate: () => [],
            listSamples: () => ({}),
            createSamples: () => ({})
        };

        const resolved = resolveRunnerFunctionLocators(context, runner);
        expect(resolved.functions.get(".::utilities/twice")).toMatchObject({
            name: "utilities.twice",
            fn: nestedTwice,
            receiver: utilities
        });

        expect(() =>
            resolveRunnerFunctionLocators(context, {
                ...runner,
                discover: () => [{ modulePath: ".", exportPath: ["secret"] }]
            })
        ).toThrow("located missing public function secret");
        expect(getterCalls).toBe(0);
    });

    test("rejects a target package changed after suite generation", async () => {
        let loads = 0;
        const suite = createModuleSuite({
            name: "stale-target",
            resolve: () => new URL("../src/index.ts", import.meta.url).href,
            load: () => {
                loads++;
                return Promise.resolve({ value: () => 1 });
            },
            package: { name: "@af-utils/check-hot", version: "999.0.0" },
            samples: { value: [{ label: "call", args: () => [] }] }
        });

        await expect(
            suite.setup({
                inspect: false,
                scenarios: ["value:call"],
                preflightOutcomes: [],
                runtime: {
                    name: "node",
                    version: process.versions.node,
                    engine: "v8",
                    engineVersion: process.versions.v8,
                    tier: "turbofan",
                    oracleId: "v8-native-intrinsics",
                    oracleVersion: "1"
                }
            })
        ).rejects.toThrow("does not match generated suite");
        expect(loads).toBe(0);
    });
});
