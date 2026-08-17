import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import {
    analyzeHotModule,
    generateHotSuiteSource
} from "../../src/analyzer.js";

const directories: string[] = [];
const candidatesNamed = (
    report: Awaited<ReturnType<typeof analyzeHotModule>>,
    name: string
) => report.candidates.filter(candidate => candidate.name === name);

afterEach(async () => {
    await Promise.all(
        directories
            .splice(0)
            .map(directory => rm(directory, { force: true, recursive: true }))
    );
});

describe("exports-first module graph", () => {
    test("drops ambiguous star exports while preserving explicit and identical bindings", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({ name: "star-exports", type: "module" })
        );
        await writeFile(
            join(directory, "common.js"),
            "export function identical(value) { return value; }"
        );
        await writeFile(
            join(directory, "left.js"),
            [
                "export function collision(value) { return value + 1; }",
                "export function leftOnly(value) { return value; }",
                'export { identical } from "./common.js";'
            ].join("\n")
        );
        await writeFile(
            join(directory, "right.js"),
            [
                "export function collision(value) { return value + 2; }",
                "export function rightOnly(value) { return value; }",
                'export { identical } from "./common.js";'
            ].join("\n")
        );
        await writeFile(
            join(directory, "ambiguous.js"),
            'export * from "./left.js"; export * from "./right.js";'
        );
        await writeFile(
            join(directory, "explicit.js"),
            [
                'export * from "./left.js";',
                'export * from "./right.js";',
                'export { collision } from "./left.js";'
            ].join("\n")
        );

        const ambiguous = await analyzeHotModule({
            input: join(directory, "ambiguous.js")
        });
        const explicit = await analyzeHotModule({
            input: join(directory, "explicit.js")
        });
        expect(candidatesNamed(ambiguous, "collision")).toHaveLength(2);
        expect(
            candidatesNamed(ambiguous, "collision").every(
                candidate => !candidate.exported
            )
        ).toBe(true);
        expect(
            candidatesNamed(ambiguous, "identical").filter(
                candidate => candidate.exported
            )
        ).toHaveLength(1);
        expect(
            candidatesNamed(ambiguous, "leftOnly").some(
                candidate => candidate.exported
            )
        ).toBe(true);
        expect(
            candidatesNamed(ambiguous, "rightOnly").some(
                candidate => candidate.exported
            )
        ).toBe(true);
        expect(
            candidatesNamed(explicit, "collision").filter(
                candidate => candidate.exported
            )
        ).toHaveLength(1);
        expect(
            candidatesNamed(explicit, "collision").find(
                candidate => candidate.exported
            )?.file
        ).toBe(join(directory, "left.js"));
    });

    test("rejects an ignored generated file that can change resolution", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        const entry = join(directory, "index.js");
        const selected = join(directory, "check-hot.suite.js");
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({ name: "output-collision", type: "module" })
        );
        await writeFile(entry, 'export { hot } from "./check-hot.suite";');
        await writeFile(selected, "export const hot = value => value + 1;");

        await expect(
            analyzeHotModule({
                input: entry,
                runtime: "bun",
                ignorePackageFiles: [join(directory, "check-hot.suite.mjs")]
            })
        ).rejects.toThrow(/can change module resolution/u);
    });

    test("rejects an ignored output that would create a wildcard public export", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        const entry = join(directory, "index.mjs");
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({
                name: "output-wildcard",
                type: "module",
                exports: { ".": "./index.mjs", "./*": "./*.mjs" }
            })
        );
        await writeFile(entry, "export const hot = value => value + 1;");

        await expect(
            analyzeHotModule({
                input: directory,
                runtime: "node",
                ignorePackageFiles: [join(directory, "check-hot.suite.mjs")]
            })
        ).rejects.toThrow(/would create or replace a public package export/u);
    });

    test("follows NodeNext .js-to-.ts edges and only marks entry exports public", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({
                name: "graph-fixture",
                type: "module",
                exports: { ".": { import: "./src/index.ts" } }
            })
        );
        await mkdir(join(directory, "src"));
        await writeFile(
            join(directory, "src/index.ts"),
            "export { publicHot } from './internal.js';"
        );
        await writeFile(
            join(directory, "src/internal.ts"),
            "export function publicHot(value) { return value + 1; } export function internalOnly() { return 1; }"
        );

        const report = await analyzeHotModule({ input: directory });
        const publicHot = report.candidates.find(
            candidate => candidate.name === "publicHot"
        );
        const internalOnly = report.candidates.find(
            candidate => candidate.name === "internalOnly"
        );

        expect(report.graphComplete).toBe(true);
        expect(publicHot).toMatchObject({
            exported: true,
            exportName: "publicHot",
            publicPaths: ["publicHot"]
        });
        expect(internalOnly?.exported).toBe(false);
    });

    test("prefers the exact runtime JavaScript artifact over a TypeScript sibling", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({ name: "artifact-fixture", type: "module" })
        );
        await writeFile(
            join(directory, "index.js"),
            'export { runtimeHot } from "./implementation.js";'
        );
        await writeFile(
            join(directory, "implementation.js"),
            "export function runtimeHot(value) { return value + 1; }"
        );
        await writeFile(
            join(directory, "implementation.ts"),
            "export function wrongSourceHot(value: number) { return value * 2; }"
        );

        const report = await analyzeHotModule({
            input: join(directory, "index.js")
        });

        expect(
            report.candidates.find(candidate => candidate.name === "runtimeHot")
        ).toMatchObject({ exported: true, exportName: "runtimeHot" });
        expect(
            report.candidates.some(
                candidate => candidate.name === "wrongSourceHot"
            )
        ).toBe(false);
    });

    test("uses Bun's local ESM extensionless source order", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({ name: "bun-extension-fixture", type: "module" })
        );
        await writeFile(
            join(directory, "index.ts"),
            'export { selectedHot } from "./dependency";'
        );
        await writeFile(
            join(directory, "dependency.ts"),
            "export function selectedHot(value: number) { return value + 1; }"
        );
        await writeFile(
            join(directory, "dependency.js"),
            "export function wrongJavaScriptHot(value) { return value + 2; }"
        );

        const report = await analyzeHotModule({
            input: join(directory, "index.ts"),
            runtime: "bun"
        });

        expect(
            report.candidates.find(
                candidate => candidate.name === "selectedHot"
            )
        ).toMatchObject({ exported: true });
        expect(
            report.candidates.some(
                candidate => candidate.name === "wrongJavaScriptHot"
            )
        ).toBe(false);
    });

    test("excludes erased type-only edges while retaining mixed runtime imports", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({ name: "type-edge-fixture", type: "module" })
        );
        await writeFile(
            join(directory, "index.ts"),
            [
                'import type { Missing } from "./missing-import.js";',
                'export type { AlsoMissing } from "./missing-export.js";',
                'import { type MixedType, runtimeHot } from "./mixed.js";',
                "export { runtimeHot };"
            ].join("\n")
        );
        await writeFile(
            join(directory, "mixed.js"),
            "export function runtimeHot(value) { return value + 1; }"
        );

        const report = await analyzeHotModule({
            input: join(directory, "index.ts")
        });

        expect(report.graphComplete).toBe(true);
        expect(report.diagnostics).toEqual([]);
        expect(report.files).toBe(2);
        expect(report.sourceLoader).toBe("tsx");
        expect(
            report.candidates.find(candidate => candidate.name === "runtimeHot")
        ).toMatchObject({ exported: true, exportName: "runtimeHot" });
    });

    test("records resolved runtime assets as terminal graph edges", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({ name: "terminal-edge-fixture" })
        );
        const entry = join(directory, "index.cjs");
        await writeFile(
            entry,
            [
                'const data = require("./data.json");',
                'require("./native.node");',
                "exports.runtimeHot = value => value + data.offset;"
            ].join("\n")
        );
        await writeFile(join(directory, "data.json"), '{"offset":1}');
        await writeFile(join(directory, "native.node"), "fixture");

        const report = await analyzeHotModule({ input: entry });

        expect(report.graphComplete).toBe(true);
        expect(report.diagnostics).toEqual([]);
        expect(report.files).toBe(1);
        expect(report.candidates[0]).toMatchObject({
            name: "runtimeHot",
            exported: true
        });
    });

    test("traces import-then-export aliases, defaults, and namespaces", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({ name: "import-export-fixture", type: "module" })
        );
        await writeFile(
            join(directory, "index.js"),
            [
                'import fallback, { original as local } from "./implementation.js";',
                'import * as api from "./implementation.js";',
                "export { local as named, fallback as default, api };"
            ].join("\n")
        );
        await writeFile(
            join(directory, "implementation.js"),
            [
                "export function original(value) { return value + 1; }",
                "export default function fallback(value) { return value * 2; }",
                "export function privateImplementation() { return 0; }"
            ].join("\n")
        );

        const report = await analyzeHotModule({
            input: join(directory, "index.js")
        });
        const original = report.candidates.find(
            candidate => candidate.name === "original"
        );
        const fallback = report.candidates.find(
            candidate => candidate.name === "fallback"
        );

        expect(original).toMatchObject({
            exported: true,
            exportName: "named"
        });
        expect(original?.publicPaths).toContain("api.original");
        expect(fallback).toMatchObject({
            exported: true,
            exportName: "default"
        });
    });

    test("keeps unresolved local edges visible and marks the graph incomplete", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        const file = join(directory, "index.ts");
        await writeFile(file, "export { missing } from './missing.js';");

        const report = await analyzeHotModule({ input: file });

        expect(report.graphComplete).toBe(false);
        expect(report.diagnostics.join("\n")).toContain(
            'unresolved module edge "./missing.js"'
        );
    });

    test("resolves runtime-specific package export conditions", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({
                name: "conditional-fixture",
                type: "module",
                exports: {
                    ".": {
                        deno: "./deno.js",
                        bun: "./bun.js",
                        node: "./node.js",
                        default: "./default.js"
                    }
                }
            })
        );
        for (const runtime of ["node", "deno", "bun"] as const) {
            // oxlint-disable-next-line no-await-in-loop -- Each runtime condition needs its own fixture artifact.
            await writeFile(
                join(directory, `${runtime}.js`),
                `export function ${runtime}Hot(value) { return value + 1; }`
            );
        }
        await writeFile(
            join(directory, "default.js"),
            "export function defaultHot(value) { return value + 1; }"
        );

        for (const runtime of ["node", "deno", "bun"] as const) {
            // oxlint-disable-next-line no-await-in-loop -- Each resolver condition is an independent public-entry assertion.
            const report = await analyzeHotModule({
                input: directory,
                runtime
            });
            expect(report.entry).toBe(join(directory, `${runtime}.js`));
            expect(report.candidates[0].name).toBe(`${runtime}Hot`);
        }
    });

    test("uses ESM import branches and the Node fallback of Deno and Bun", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({
                name: "compat-conditions-fixture",
                type: "module",
                exports: {
                    ".": {
                        require: "./require.cjs",
                        node: "./node.js",
                        import: "./import.js",
                        default: "./default.js"
                    }
                }
            })
        );
        await writeFile(
            join(directory, "require.cjs"),
            "exports.wrongRequireBranch = value => value;"
        );
        await writeFile(
            join(directory, "node.js"),
            "export const nodeFallback = value => value + 1;"
        );
        await writeFile(
            join(directory, "import.js"),
            "export const importFallback = value => value + 1;"
        );
        await writeFile(
            join(directory, "default.js"),
            "export const wrongDefaultBranch = value => value;"
        );

        for (const runtime of ["node", "deno", "bun"] as const) {
            // oxlint-disable-next-line no-await-in-loop -- Every runtime must activate the Node compatibility condition before import/default.
            const report = await analyzeHotModule({
                input: directory,
                runtime
            });
            expect(report.entry).toBe(join(directory, "node.js"));
            expect(report.candidates[0].name).toBe("nodeFallback");
        }
    });

    test("uses runtime-specific package fields when exports is absent", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({
                name: "main-field-fixture",
                type: "module",
                main: "./main.js",
                module: "./module.js"
            })
        );
        await writeFile(
            join(directory, "main.js"),
            "export function nativeMain(value) { return value + 1; }"
        );
        await writeFile(
            join(directory, "module.js"),
            "export function nonstandardModule(value) { return value + 1; }"
        );

        for (const runtime of ["node", "deno", "bun"] as const) {
            // oxlint-disable-next-line no-await-in-loop -- Each runtime independently asserts its legacy-main policy.
            const report = await analyzeHotModule({
                input: directory,
                runtime
            });
            expect(report.entry).toBe(join(directory, "main.js"));
            expect(report.candidates[0].name).toBe("nativeMain");
        }
    });

    test("does not activate the Deno import condition for require edges", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        const dependency = join(directory, "node_modules", "deno-dual");
        await mkdir(dependency, { recursive: true });
        await writeFile(
            join(dependency, "package.json"),
            JSON.stringify({
                name: "deno-dual",
                exports: {
                    ".": {
                        deno: "./deno.js",
                        require: "./require.cjs",
                        default: "./default.js"
                    }
                }
            })
        );
        await writeFile(
            join(dependency, "deno.js"),
            "export const wrongDenoImport = value => value;"
        );
        await writeFile(
            join(dependency, "require.cjs"),
            "exports.denoRequire = value => value + 1;"
        );
        await writeFile(
            join(dependency, "default.js"),
            "export const wrongDefault = value => value;"
        );
        const entry = join(directory, "index.cjs");
        await writeFile(entry, 'module.exports = require("deno-dual");');

        const report = await analyzeHotModule({
            input: entry,
            runtime: "deno"
        });

        expect(report.graphComplete).toBe(false);
        expect(report.diagnostics.join("\n")).toContain(
            "not transitively source-authenticated"
        );
        expect(report.externalBoundaries).toContainEqual(
            expect.objectContaining({
                request: "deno-dual",
                mode: "require",
                packageRelativeFile: "require.cjs"
            })
        );
        expect(
            report.externalBoundaries.some(
                boundary => boundary.packageRelativeFile === "deno.js"
            )
        ).toBe(false);
    });

    test("preserves require mode for dual-package CommonJS edges", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        const dependency = join(directory, "node_modules", "dual-fixture");
        await mkdir(dependency, { recursive: true });
        await writeFile(
            join(dependency, "package.json"),
            JSON.stringify({
                name: "dual-fixture",
                type: "module",
                exports: {
                    ".": {
                        import: "./import.js",
                        require: "./require.cjs"
                    }
                }
            })
        );
        await writeFile(
            join(dependency, "import.js"),
            "export function wrongImportBranch(value) { return value; }"
        );
        await writeFile(
            join(dependency, "require.cjs"),
            "exports.requireHot = function requireHot(value) { return value + 1; };"
        );
        const entry = join(directory, "index.cjs");
        await writeFile(entry, 'module.exports = require("dual-fixture");');

        for (const runtime of ["node", "deno", "bun"] as const) {
            // oxlint-disable-next-line no-await-in-loop -- Every runtime must resolve a source-level require edge with require conditions.
            const report = await analyzeHotModule({ input: entry, runtime });
            expect(report.graphComplete).toBe(false);
            expect(report.diagnostics.join("\n")).toContain(
                "not transitively source-authenticated"
            );
            expect(report.externalBoundaries).toContainEqual(
                expect.objectContaining({
                    request: "dual-fixture",
                    mode: "require",
                    packageRelativeFile: "require.cjs"
                })
            );
            expect(
                report.externalBoundaries.some(
                    boundary => boundary.packageRelativeFile === "import.js"
                )
            ).toBe(false);
        }
    });

    test.each(["node:module", "module"])(
        "follows createRequire from %s without treating nested shadows as edges",
        async moduleSpecifier => {
            const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
            directories.push(directory);
            const entry = join(directory, "index.mjs");
            await writeFile(
                entry,
                [
                    `import { createRequire as makeRequire } from ${JSON.stringify(moduleSpecifier)};`,
                    "const localRequire = makeRequire(import.meta.url);",
                    'export const loaded = localRequire("./dependency.cjs");',
                    "export function shadowed(localRequire) {",
                    '    return localRequire("./missing.cjs");',
                    "}"
                ].join("\n")
            );
            await writeFile(
                join(directory, "dependency.cjs"),
                "exports.createRequireHot = value => value + 1;"
            );

            const report = await analyzeHotModule({
                input: entry,
                runtime: "node"
            });

            expect(report.graphComplete).toBe(true);
            expect(
                report.candidates.some(
                    candidate => candidate.name === "createRequireHot"
                )
            ).toBe(true);
            expect(report.diagnostics.join("\n")).not.toContain("missing.cjs");
        }
    );

    test("follows TypeScript import-equals/export-assignment as a require edge", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        const dependency = join(directory, "node_modules", "dual-fixture");
        await mkdir(dependency, { recursive: true });
        await writeFile(
            join(dependency, "package.json"),
            JSON.stringify({
                name: "dual-fixture",
                type: "module",
                exports: {
                    ".": {
                        import: "./import.js",
                        require: "./require.cjs"
                    }
                }
            })
        );
        await writeFile(
            join(dependency, "import.js"),
            "export function wrongImportBranch(value) { return value; }"
        );
        await writeFile(
            join(dependency, "require.cjs"),
            "exports.requireHot = function requireHot(value) { return value + 1; };"
        );
        const entry = join(directory, "index.cts");
        await writeFile(
            entry,
            'import dual = require("dual-fixture"); export = dual;'
        );

        const report = await analyzeHotModule({ input: entry });

        expect(report.graphComplete).toBe(false);
        expect(report.diagnostics.join("\n")).toContain(
            "not transitively source-authenticated"
        );
        expect(report.sourceLoader).toBe("tsx");
        expect(report.externalBoundaries).toContainEqual(
            expect.objectContaining({
                request: "dual-fixture",
                mode: "require",
                packageRelativeFile: "require.cjs"
            })
        );
        expect(
            report.externalBoundaries.some(
                boundary => boundary.packageRelativeFile === "import.js"
            )
        ).toBe(false);
    });

    test("analyzes every exact public package subpath and reports wildcard gaps", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        await mkdir(join(directory, "src"));
        await mkdir(join(directory, "src/templates"));
        await mkdir(join(directory, "assets"));
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({
                name: "subpath-fixture",
                type: "module",
                exports: {
                    ".": "./src/index.js",
                    "./feature": "./src/feature.js",
                    "./compat.json": "./src/compat.js",
                    "./templates/*": "./src/templates/*.js",
                    "./assets/*": "./assets/*",
                    "./missing/*": "./missing/*",
                    "./README.md": "./README.md",
                    "./styles": "./styles.css"
                }
            })
        );
        await writeFile(
            join(directory, "src/index.js"),
            "export function rootHot(value) { return value + 1; }"
        );
        await writeFile(
            join(directory, "src/feature.js"),
            "export function featureHot(value) { return value * 2; }"
        );
        await writeFile(
            join(directory, "src/compat.js"),
            "export function compatHot(value) { return value * 3; }"
        );
        await writeFile(
            join(directory, "src/templates/card.js"),
            "export function templateHot(value) { return value / 2; }"
        );
        await writeFile(join(directory, "README.md"), "fixture");
        await writeFile(join(directory, "styles.css"), "body {}");
        await writeFile(join(directory, "assets/model.wasm"), "fixture");

        const report = await analyzeHotModule({ input: directory });
        const feature = report.candidates.find(
            candidate => candidate.name === "featureHot"
        );

        expect(feature).toMatchObject({
            exported: true,
            exportName: undefined,
            targetId: "./feature::featureHot",
            publicTargets: [
                { modulePath: "./feature", exportPath: ["featureHot"] }
            ],
            publicPaths: ["./feature:featureHot"]
        });
        expect(report.publicEntries).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    modulePath: ".",
                    entryPackagePath: "src/index.js"
                }),
                expect.objectContaining({
                    modulePath: "./feature",
                    entryPackagePath: "src/feature.js"
                }),
                expect.objectContaining({
                    modulePath: "./compat.json",
                    entryPackagePath: "src/compat.js"
                })
            ])
        );
        const generated = generateHotSuiteSource(report, {
            importSpecifier: "public-subpaths",
            moduleSpecifiers: report.publicEntries.map(entry => ({
                modulePath: entry.modulePath,
                importSpecifier:
                    entry.modulePath === "."
                        ? "public-subpaths"
                        : `public-subpaths${entry.modulePath.slice(1)}`
            }))
        });
        expect(generated).toContain('"modulePath": "./feature"');
        expect(generated).toContain('"./feature::featureHot"');
        expect(generated).toContain('"publicTarget": {');
        expect(
            report.obligations.filter(
                obligation => obligation.candidateId === feature?.id
            )
        ).toEqual([
            expect.objectContaining({
                exportName: "./feature::featureHot",
                publicTarget: {
                    modulePath: "./feature",
                    exportPath: ["featureHot"]
                }
            })
        ]);
        expect(
            report.candidates.find(
                candidate => candidate.name === "templateHot"
            )
        ).toMatchObject({
            exported: true,
            exportName: undefined,
            publicPaths: ["./templates/card:templateHot"]
        });
        expect(
            report.candidates.find(candidate => candidate.name === "compatHot")
        ).toMatchObject({
            exported: true,
            publicPaths: ["./compat.json:compatHot"]
        });
        expect(report.files).toBe(4);
        expect(report.graphComplete).toBe(true);
    });

    test("skips type-only exports and honors more-specific null wildcard exclusions", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        await mkdir(join(directory, "dist/internal"), { recursive: true });
        await mkdir(join(directory, "dist/conditional"), { recursive: true });
        await mkdir(join(directory, "fallback/internal"), { recursive: true });
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({
                name: "excluded-subpath-fixture",
                type: "module",
                exports: {
                    ".": "./index.js",
                    "./*": "./dist/*.js",
                    "./internal/*": null,
                    "./conditional": {
                        node: null,
                        default: "./fallback/conditional.js"
                    },
                    "./conditional/*": {
                        node: null,
                        default: "./fallback/internal/*.js"
                    },
                    "./types-only": { types: "./types-only.d.ts" }
                }
            })
        );
        await writeFile(
            join(directory, "index.js"),
            "export function rootHot(value) { return value + 1; }"
        );
        await writeFile(
            join(directory, "dist/public.js"),
            "export function publicHot(value) { return value + 1; }"
        );
        await writeFile(
            join(directory, "dist/internal/private.js"),
            "export function privateHot(value) { return value + 1; }"
        );
        await writeFile(
            join(directory, "dist/conditional.js"),
            "export function conditionallyPrivateHot(value) { return value + 1; }"
        );
        await writeFile(
            join(directory, "dist/conditional/private.js"),
            "export function conditionallyPrivatePatternHot(value) { return value + 1; }"
        );
        await writeFile(
            join(directory, "fallback/conditional.js"),
            "export function wrongFallbackHot(value) { return value + 1; }"
        );
        await writeFile(
            join(directory, "fallback/internal/private.js"),
            "export function wrongFallbackPatternHot(value) { return value + 1; }"
        );
        await writeFile(
            join(directory, "types-only.d.ts"),
            "export declare const typeOnly: unique symbol;"
        );

        const report = await analyzeHotModule({ input: directory });

        expect(report.graphComplete).toBe(true);
        expect(report.diagnostics).toEqual([]);
        expect(report.files).toBe(2);
        expect(
            report.candidates.find(candidate => candidate.name === "publicHot")
        ).toMatchObject({ exported: true });
        expect(
            report.candidates.some(candidate => candidate.name === "privateHot")
        ).toBe(false);
        expect(
            report.candidates.some(candidate =>
                candidate.name.includes("Private")
            )
        ).toBe(false);
        expect(
            report.candidates.some(candidate =>
                candidate.name.startsWith("wrongFallback")
            )
        ).toBe(false);
    });

    test("traces CommonJS exported-object assignments without a package registry", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        const file = join(directory, "index.cjs");
        await writeFile(
            file,
            [
                "function map(values, callback) { return values.map(callback); }",
                "function internalOnly() { return 1; }",
                "const publicApi = {};",
                "publicApi.map = map;",
                "module.exports = publicApi;"
            ].join("\n")
        );

        const report = await analyzeHotModule({ input: file });

        expect(
            report.candidates.find(candidate => candidate.name === "map")
        ).toMatchObject({ exported: true, exportName: "map" });
        expect(
            report.candidates.find(
                candidate => candidate.name === "internalOnly"
            )?.exported
        ).toBe(false);
    });

    test("traces CommonJS object literals, aliases, inline members, and defaults", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        const objectFile = join(directory, "object.cjs");
        const memberFile = join(directory, "members.cjs");
        const defaultFile = join(directory, "default.cjs");
        await writeFile(
            objectFile,
            [
                "function map(values) { return values; }",
                "function implementation(values) { return values; }",
                "module.exports = { map, filter: implementation, method(value) { return value; } };"
            ].join("\n")
        );
        await writeFile(
            memberFile,
            [
                "exports.map = function (values) { return values; };",
                "module.exports.filter = (values) => values;"
            ].join("\n")
        );
        await writeFile(
            defaultFile,
            "module.exports = function (value) { return value; };"
        );

        const objectReport = await analyzeHotModule({ input: objectFile });
        const memberReport = await analyzeHotModule({ input: memberFile });
        const defaultReport = await analyzeHotModule({ input: defaultFile });

        expect(
            objectReport.candidates.find(candidate => candidate.name === "map")
        ).toMatchObject({ exported: true, exportName: "map" });
        expect(
            objectReport.candidates.find(
                candidate => candidate.name === "implementation"
            )
        ).toMatchObject({ exported: true, exportName: "filter" });
        expect(
            objectReport.candidates.find(
                candidate => candidate.name === "method"
            )
        ).toMatchObject({ exported: true, exportName: "method" });
        expect(
            memberReport.candidates.every(candidate => candidate.exported)
        ).toBe(true);
        expect(defaultReport.candidates[0]).toMatchObject({
            exported: true,
            exportName: "default"
        });
    });

    test("ignores nested alias poisoning and recognizes an inline exported-object member", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        const entry = join(directory, "index.cjs");
        await writeFile(
            entry,
            [
                "const api = {};",
                "function poison() { const api = other; return api; }",
                "api.hot = function (value) { return value + 1; };",
                "module.exports = api;"
            ].join("\n")
        );

        const report = await analyzeHotModule({ input: entry });
        expect(
            report.candidates.find(candidate => candidate.name === "hot")
        ).toMatchObject({ exported: true, exportName: "hot" });
        expect(
            report.candidates.some(candidate => candidate.name === "poison")
        ).toBe(true);
    });

    test("traces a CommonJS namespace forwarded through require", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        const entry = join(directory, "index.cjs");
        await writeFile(
            entry,
            "module.exports = require('./implementation.cjs');"
        );
        await writeFile(
            join(directory, "implementation.cjs"),
            [
                "function map(values, callback) { return values.map(callback); }",
                "function hidden() { return 0; }",
                "exports.map = map;"
            ].join("\n")
        );

        const report = await analyzeHotModule({ input: entry });

        expect(
            report.candidates.find(candidate => candidate.name === "map")
        ).toMatchObject({ exported: true, exportName: "map" });
        expect(
            report.candidates.find(candidate => candidate.name === "hidden")
        ).toMatchObject({ exported: false });
    });

    test("does not treat shadowed CommonJS globals as a public surface", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        const file = join(directory, "shadowed.cjs");
        await writeFile(
            file,
            "const exports = {}; function hidden(value) { return value; } exports.hidden = hidden;"
        );

        const report = await analyzeHotModule({ input: file });

        expect(
            report.candidates.find(candidate => candidate.name === "hidden")
        ).toMatchObject({ exported: false });
    });

    test("does not let block-local CommonJS names hide real outer edges", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        const entry = join(directory, "index.cjs");
        await writeFile(
            entry,
            [
                "const dependency = require('./dependency.cjs');",
                "{ const require = () => ({}); const exports = {}; require('ignored'); exports.hidden = () => 0; }",
                "function read() { return dependency.value; }",
                "exports.read = read;"
            ].join("\n")
        );
        await writeFile(
            join(directory, "dependency.cjs"),
            "exports.value = 1;"
        );

        const report = await analyzeHotModule({ input: entry });

        expect(report.files).toBe(2);
        expect(report.graphComplete).toBe(true);
        expect(
            report.candidates.find(candidate => candidate.name === "read")
        ).toMatchObject({ exported: true, exportName: "read" });
    });

    test("never assigns a public export to a same-name nested function", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        const entry = join(directory, "index.js");
        await writeFile(
            entry,
            "export function hot(value) { function hot(inner) { return inner + 1; } return hot(value); }"
        );

        const report = await analyzeHotModule({ input: entry });
        const matches = report.candidates.filter(
            candidate => candidate.name === "hot"
        );

        expect(matches).toHaveLength(2);
        expect(
            matches.filter(candidate => candidate.exportName === "hot")
        ).toHaveLength(1);
        expect(matches.find(candidate => !candidate.exportName)?.exported).toBe(
            false
        );
    });

    test("uses top-level binding identity instead of an object method name", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        const entry = join(directory, "index.js");
        await writeFile(
            entry,
            [
                "export function increment(value) { return value + 1; }",
                "export const nested = { increment(value) { return value + 2; } };"
            ].join("\n")
        );

        const report = await analyzeHotModule({ input: entry });
        const matches = report.candidates.filter(
            candidate => candidate.name === "increment"
        );

        expect(matches).toHaveLength(2);
        expect(matches.filter(candidate => candidate.exported)).toEqual([
            expect.objectContaining({
                exportName: "increment",
                targetId: "increment"
            })
        ]);
        expect(matches.find(candidate => !candidate.exported)).toMatchObject({
            exportName: undefined,
            targetId: undefined,
            publicTargets: []
        });
        expect(
            report.obligations.filter(obligation =>
                matches.some(
                    candidate =>
                        candidate.exported &&
                        candidate.id === obligation.candidateId
                )
            )
        ).not.toHaveLength(0);
        expect(
            report.obligations.some(
                obligation =>
                    obligation.candidateId ===
                    matches.find(candidate => !candidate.exported)?.id
            )
        ).toBe(false);
    });

    test("maps an exported variable binding instead of a function expression name", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        const entry = join(directory, "index.js");
        await writeFile(
            entry,
            "const hot = function internalName(value) { return value + 1; }; export { hot as publicHot };"
        );

        const report = await analyzeHotModule({ input: entry });

        expect(
            report.candidates.find(
                candidate => candidate.name === "internalName"
            )
        ).toMatchObject({
            exported: true,
            exportName: "publicHot",
            targetId: "publicHot"
        });
    });

    test("marks nonliteral runtime module edges incomplete", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        const entry = join(directory, "index.js");
        await writeFile(
            entry,
            "export async function load(name) { return import(name); }"
        );

        const report = await analyzeHotModule({ input: entry });
        expect(report.graphComplete).toBe(false);
        expect(report.diagnostics.join("\n")).toContain(
            "nonliteral dynamic import"
        );
    });

    test("reports resolved dependencies outside the selected package boundary", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-graph-"));
        directories.push(directory);
        const dependency = join(directory, "node_modules/external-fixture");
        await mkdir(dependency, { recursive: true });
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({ name: "boundary-fixture", type: "module" })
        );
        await writeFile(
            join(directory, "index.js"),
            'import { helper } from "external-fixture"; export const hot = value => helper(value);'
        );
        await writeFile(
            join(dependency, "package.json"),
            JSON.stringify({
                name: "external-fixture",
                version: "2.3.4",
                type: "module",
                exports: "./index.js"
            })
        );
        await writeFile(
            join(dependency, "index.js"),
            "export const helper = value => value + 1;"
        );

        const report = await analyzeHotModule({
            input: join(directory, "index.js")
        });

        expect(report.graphComplete).toBe(false);
        expect(report.diagnostics.join("\n")).toContain(
            "not transitively source-authenticated"
        );
        expect(report.files).toBe(1);
        expect(report.externalBoundaries).toEqual([
            {
                importer: "index.js",
                request: "external-fixture",
                mode: "import",
                packageName: "external-fixture",
                packageVersion: "2.3.4",
                packageRelativeFile: "index.js"
            }
        ]);
        expect(report.limitations.join("\n")).toContain(
            "not claimed as statically analyzed or source-authenticated"
        );
    });
});
