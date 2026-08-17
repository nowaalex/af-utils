import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import {
    analyzeHotModule,
    formatHotAnalysis,
    generateHotSuiteSource
} from "../src/analyzer.js";

const temporaryDirectories: string[] = [];
const fixtureSourceSha256 = "0".repeat(64);
const fixturePackageTree = {
    sourceSha256: fixtureSourceSha256,
    fileCount: 0,
    ignoredRelativeFiles: []
} as const;
const fixtureRunnerSourceGraph = [
    { relativeFile: "runner.js", sourceSha256: fixtureSourceSha256 }
] as const;

afterEach(async () => {
    await Promise.all(
        temporaryDirectories
            .splice(0)
            .map(path => rm(path, { force: true, recursive: true }))
    );
});

describe("Oxc hot-path analyzer", () => {
    test("assigns a marker to only its first following candidate", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-analyzer-"));
        temporaryDirectories.push(directory);
        const file = join(directory, "fixture.js");
        await writeFile(
            file,
            [
                "// check-hot: A",
                "export function A(value) { return value + 1; }",
                "export function B(value) { return value + 2; }"
            ].join("\n")
        );

        const report = await analyzeHotModule({ input: file });

        expect(
            report.candidates.find(candidate => candidate.name === "A")
                ?.annotation
        ).toBe("A");
        expect(
            report.candidates.find(candidate => candidate.name === "B")
                ?.annotation
        ).toBeUndefined();
    });

    test("ranks annotations and reports shape and loop risks", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-analyzer-"));
        temporaryDirectories.push(directory);
        const file = join(directory, "fixture.ts");
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({
                name: "fixture",
                version: "1.2.3",
                type: "module"
            })
        );
        await writeFile(
            file,
            [
                "// check-hot: fixture.hot",
                "export function hot(values: unknown[], keys: string[]) {",
                "    const result = [];",
                "    for (let index = 0; index < keys.length; index++) {",
                "        const record = { value: values[index] };",
                "        result.push(record[keys[index]]);",
                "        delete record.value;",
                "    }",
                "    return result;",
                "}"
            ].join("\n")
        );

        const report = await analyzeHotModule({ input: file });

        expect(report.packageName).toBe("fixture");
        expect(report.packageVersion).toBe("1.2.3");
        expect(report.sourceLoader).toBe("tsx");
        expect(report.candidates[0]).toMatchObject({
            id: "fixture.ts#fixture.hot@2:33",
            annotation: "fixture.hot",
            exportName: "hot",
            exported: true
        });
        expect(report.findings.map(finding => finding.rule)).toEqual(
            expect.arrayContaining([
                "allocation-in-loop",
                "delete-property",
                "dynamic-keyed-access-in-loop"
            ])
        );
        const formatted = formatHotAnalysis(report);
        expect(formatted).toContain("risk(s)");
        expect(formatted).toContain(
            "Ambiguous parameter .length receiver [ambiguous-length-access]"
        );
    });

    test("ranks runnable public functions before unmarked internals", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-analyzer-"));
        temporaryDirectories.push(directory);
        const file = join(directory, "fixture.js");
        await writeFile(
            file,
            [
                "function internal(values) {",
                "    for (const value of values) {",
                "        for (const key in value) delete value[key];",
                "    }",
                "}",
                "export function publicApi(value) { return value; }"
            ].join("\n")
        );

        const report = await analyzeHotModule({ input: file });
        expect(report.candidates[0]).toMatchObject({
            name: "publicApi",
            exported: true
        });
        expect(
            report.candidates.find(candidate => candidate.name === "internal")
                ?.score
        ).toBeGreaterThan(report.candidates[0].score);

        await writeFile(
            file,
            [
                "// check-hot: internal",
                "function internal(value) { return value; }",
                "export function publicApi(value) { return value; }"
            ].join("\n")
        );
        const annotated = await analyzeHotModule({ input: file });
        expect(annotated.candidates[0]).toMatchObject({
            name: "internal",
            annotation: "internal"
        });
    });

    test("generates safe scaffolds unless probing is explicit", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-analyzer-"));
        temporaryDirectories.push(directory);
        const file = join(directory, "fixture.js");
        await writeFile(
            file,
            "export const map = (items, fn) => items.map(fn);\n"
        );
        const report = await analyzeHotModule({ input: file });

        const safe = generateHotSuiteSource(report, {
            importSpecifier: "./fixture.js"
        });
        const probed = generateHotSuiteSource(report, {
            importSpecifier: "./fixture.js",
            testRunnerSpecifier: "./fixture-test-runner.ts",
            probeManifest: {
                runnerId: "fixture",
                runnerVersion: "1.0.0",
                runnerSourceSha256: fixtureSourceSha256,
                runnerPackageTree: fixturePackageTree,
                runnerEntryPackagePath: "runner.js",
                runnerSourceGraph: fixtureRunnerSourceGraph,
                package: {},
                runtime: {
                    name: "node",
                    version: "26.0.0",
                    engine: "v8",
                    engineVersion: "14.1.0"
                },
                samples: { map: ["numbers"] },
                targets: {
                    map: {
                        sourceSha256: report.candidates.find(
                            candidate => candidate.name === "map"
                        )?.sourceSha256 as string
                    }
                },
                coverage: { map: { numbers: [] } },
                attempts: [
                    {
                        functionName: "map",
                        label: "numbers",
                        status: "accepted"
                    },
                    {
                        functionName: "map",
                        label: "bad-input",
                        status: "threw",
                        stage: "verify",
                        error: "fixture rejection"
                    }
                ]
            }
        });

        expect(safe).toContain("Add deterministic samples");
        expect(safe).toContain('"runtime": "node"');
        expect(safe).toContain('runtimes: ["node"]');
        expect(safe).not.toContain("testRunner");
        expect(probed).toContain(
            "const loadTestRunner = () => loadHotTestRunner(import.meta.resolve(testRunnerSpecifier), probeManifest.runnerSourceSha256, probeManifest.runnerPackageTree, probeManifest.runnerEntryPackagePath, probeManifest.runnerSourceGraph)"
        );
        expect(probed).toContain("testRunner: loadTestRunner");
        expect(probed).toContain('workerLoader: "tsx"');
        expect(probed).not.toContain('"sourceLoader": "tsx"');
        expect(probed).toContain('"numbers"');
        expect(probed).toContain('"runnerVersion": "1.0.0"');
        expect(probed).toContain('"bad-input"');
        expect(probed).toContain('"stage": "verify"');
        expect(probed).toContain("disposable node process");
        expect(() =>
            generateHotSuiteSource(report, {
                importSpecifier: "./fixture.js",
                functions: ["map"]
            })
        ).toThrow("only together with a versioned probe manifest");

        await expect(
            analyzeHotModule({ input: file, runtime: "deno" }).then(
                denoReport =>
                    generateHotSuiteSource(denoReport, {
                        importSpecifier: "./fixture.js",
                        testRunnerSpecifier: "fixture-test-runner",
                        probeManifest: {
                            runnerId: "fixture",
                            runnerVersion: "1.0.0",
                            runnerSourceSha256: fixtureSourceSha256,
                            runnerPackageTree: fixturePackageTree,
                            runnerEntryPackagePath: "runner.js",
                            runnerSourceGraph: fixtureRunnerSourceGraph,
                            package: {},
                            runtime: {
                                name: "node",
                                version: "26.0.0",
                                engine: "v8"
                            },
                            samples: {},
                            targets: {},
                            coverage: {},
                            attempts: []
                        }
                    })
            )
        ).rejects.toThrow(/does not match analyzed runtime/u);
    });

    test("reconciles a runtime export only by exact owning-source identity", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-analyzer-"));
        temporaryDirectories.push(directory);
        const file = join(directory, "fixture.cjs");
        await writeFile(
            file,
            [
                "(function buildApi() {",
                "    function incrementInternal(value) { return value + 1; }",
                "    module.exports = { incrementInternal };",
                "})();"
            ].join("\n")
        );
        const report = await analyzeHotModule({ input: file });
        expect(report.obligations).toEqual([]);
        expect(report.limitations.join("\n")).toContain(
            "Factory/UMD/CommonJS surfaces require an isolated runtime probe"
        );

        const mismatched = generateHotSuiteSource(report, {
            importSpecifier: "./fixture.cjs",
            testRunnerSpecifier: "fixture-test-runner",
            probeManifest: {
                runnerId: "fixture",
                runnerVersion: "1.0.0",
                runnerSourceSha256: fixtureSourceSha256,
                runnerPackageTree: fixturePackageTree,
                runnerEntryPackagePath: "runner.js",
                runnerSourceGraph: fixtureRunnerSourceGraph,
                package: {},
                runtime: {
                    name: "node",
                    version: "26.0.0",
                    engine: "v8",
                    engineVersion: "14.1.0"
                },
                samples: { incrementInternal: ["number"] },
                targets: {
                    incrementInternal: {
                        sourceSha256: fixtureSourceSha256
                    }
                },
                coverage: { incrementInternal: { number: [] } },
                attempts: [
                    {
                        functionName: "incrementInternal",
                        label: "number",
                        status: "accepted"
                    }
                ]
            }
        });
        expect(mismatched).not.toContain(
            '"mutationFamily": "numeric-representation"'
        );

        const source = generateHotSuiteSource(report, {
            importSpecifier: "./fixture.cjs",
            testRunnerSpecifier: "fixture-test-runner",
            probeManifest: {
                runnerId: "fixture",
                runnerVersion: "1.0.0",
                runnerSourceSha256: fixtureSourceSha256,
                runnerPackageTree: fixturePackageTree,
                runnerEntryPackagePath: "runner.js",
                runnerSourceGraph: fixtureRunnerSourceGraph,
                package: {},
                runtime: {
                    name: "node",
                    version: "26.0.0",
                    engine: "v8",
                    engineVersion: "14.1.0"
                },
                samples: { incrementInternal: ["number"] },
                targets: {
                    incrementInternal: {
                        sourceSha256: report.candidates.find(
                            candidate => candidate.name === "incrementInternal"
                        )?.sourceSha256 as string
                    }
                },
                coverage: { incrementInternal: { number: [] } },
                attempts: [
                    {
                        functionName: "incrementInternal",
                        label: "number",
                        status: "accepted"
                    }
                ]
            }
        });

        expect(source).toContain('"exportName": "incrementInternal"');
        expect(source).toContain('"mutationFamily": "numeric-representation"');
        expect(source).toContain('"parameterIndex": 0');
    });

    test("ignores obligations only for an explicit function selection", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-analyzer-"));
        temporaryDirectories.push(directory);
        const file = join(directory, "fixture.js");
        await writeFile(
            file,
            [
                "export const selected = value => value + 1;",
                "export const unsupported = value => value + 2;"
            ].join("\n")
        );
        const report = await analyzeHotModule({ input: file });
        const selectedCandidate = report.candidates.find(
            candidate => candidate.exportName === "selected"
        );
        const probeManifest = {
            runnerId: "fixture",
            runnerVersion: "1.0.0",
            runnerSourceSha256: fixtureSourceSha256,
            runnerPackageTree: fixturePackageTree,
            runnerEntryPackagePath: "runner.js",
            runnerSourceGraph: fixtureRunnerSourceGraph,
            package: {},
            runtime: {
                name: "node" as const,
                version: "26.0.0",
                engine: "v8" as const,
                engineVersion: "14.1.0"
            },
            samples: { selected: ["number"] },
            targets: {
                selected: {
                    sourceSha256: selectedCandidate?.sourceSha256 as string
                }
            },
            coverage: { selected: { number: [] } },
            attempts: [
                {
                    functionName: "selected",
                    label: "number",
                    status: "accepted" as const
                }
            ]
        };

        const unsupportedIsBlocked = generateHotSuiteSource(report, {
            importSpecifier: "./fixture.js",
            testRunnerSpecifier: "fixture-test-runner",
            probeManifest
        });
        const unsupportedIsExplicitlyIgnored = generateHotSuiteSource(report, {
            importSpecifier: "./fixture.js",
            testRunnerSpecifier: "fixture-test-runner",
            probeManifest,
            functions: ["selected"]
        });

        expect(unsupportedIsBlocked).not.toContain("Excluded by user");
        expect(unsupportedIsExplicitlyIgnored).toContain(
            "Excluded by user --function=selected"
        );
    });
});
