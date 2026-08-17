import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, expect, test } from "vitest";

import { analyzeHotModule } from "../../src/analyzer.js";
import type { HotRuntimeName } from "../../src/types.js";

const directories: string[] = [];

afterEach(async () => {
    await Promise.all(
        directories
            .splice(0)
            .map(directory => rm(directory, { force: true, recursive: true }))
    );
});

const childProcessesAvailable =
    process.env.CODEX_PERMISSION_PROFILE === undefined;
const executableFor = (runtime: HotRuntimeName) =>
    runtime === "node" ? process.execPath : runtime;
const runtimeAvailable = (runtime: HotRuntimeName) =>
    childProcessesAvailable &&
    spawnSync(executableFor(runtime), ["--version"], {
        stdio: "ignore"
    }).status === 0;
const availableRuntimes = (["node", "deno", "bun"] as const).filter(runtime =>
    runtimeAvailable(runtime)
);
const requiredRuntimes = new Set(
    process.env.CHECK_HOT_REQUIRE_RUNTIMES?.split(",").filter(Boolean) ?? []
);

test("provides every native resolver required by CI", () => {
    for (const runtime of requiredRuntimes) {
        expect(
            runtimeAvailable(runtime as HotRuntimeName),
            `${runtime} was required, but its native resolver process could not start`
        ).toBe(true);
    }
});

const writeMarkerModule = (file: string, marker: string) =>
    writeFile(file, `export const marker = ${JSON.stringify(marker)};`);
const writeMarkerCommonJs = (file: string, marker: string) =>
    writeFile(file, `exports.marker = ${JSON.stringify(marker)};`);

test.each(availableRuntimes)(
    "matches %s native import/require conditions and legacy main selection",
    async runtime => {
        const directory = await mkdtemp(
            join(tmpdir(), "check-hot-native-resolution-")
        );
        directories.push(directory);
        const conditionPackage = join(
            directory,
            "node_modules/condition-fixture"
        );
        const legacyPackage = join(directory, "node_modules/legacy-fixture");
        await mkdir(conditionPackage, { recursive: true });
        await mkdir(legacyPackage, { recursive: true });
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({ name: "resolver-host", type: "module" })
        );
        await writeFile(
            join(conditionPackage, "package.json"),
            JSON.stringify({
                name: "condition-fixture",
                version: "1.0.0",
                type: "module",
                exports: {
                    ".": {
                        deno: "./deno.js",
                        bun: "./bun.js",
                        node: "./node.js",
                        import: "./import.js",
                        default: "./default.js"
                    },
                    "./require": {
                        deno: "./wrong-deno-require.cjs",
                        require: "./require.cjs",
                        bun: "./wrong-bun-require.cjs",
                        node: "./wrong-node-require.cjs",
                        default: "./wrong-default-require.cjs"
                    }
                }
            })
        );
        await Promise.all([
            writeMarkerModule(join(conditionPackage, "deno.js"), "deno.js"),
            writeMarkerModule(join(conditionPackage, "bun.js"), "bun.js"),
            writeMarkerModule(join(conditionPackage, "node.js"), "node.js"),
            writeMarkerModule(join(conditionPackage, "import.js"), "import.js"),
            writeMarkerModule(
                join(conditionPackage, "default.js"),
                "default.js"
            ),
            writeMarkerCommonJs(
                join(conditionPackage, "require.cjs"),
                "require.cjs"
            ),
            ...[
                "wrong-deno-require.cjs",
                "wrong-bun-require.cjs",
                "wrong-node-require.cjs",
                "wrong-default-require.cjs"
            ].map(file =>
                writeMarkerCommonJs(join(conditionPackage, file), file)
            )
        ]);
        await writeFile(
            join(legacyPackage, "package.json"),
            JSON.stringify({
                name: "legacy-fixture",
                version: "2.0.0",
                type: "module",
                main: "./main.cjs",
                module: "./module.js"
            })
        );
        await writeMarkerCommonJs(join(legacyPackage, "main.cjs"), "main.cjs");
        await writeMarkerModule(join(legacyPackage, "module.js"), "module.js");

        const importEntry = join(directory, "import-entry.mjs");
        const requireEntry = join(directory, "require-entry.cjs");
        const legacyEntry = join(directory, "legacy-entry.mjs");
        await writeFile(
            importEntry,
            'export { marker } from "condition-fixture";'
        );
        await writeFile(
            requireEntry,
            'module.exports = require("condition-fixture/require");'
        );
        await writeFile(
            legacyEntry,
            'export { default } from "legacy-fixture";'
        );

        const [importReport, requireReport, legacyReport] = await Promise.all([
            analyzeHotModule({ input: importEntry, runtime }),
            analyzeHotModule({ input: requireEntry, runtime }),
            analyzeHotModule({ input: legacyEntry, runtime })
        ]);
        const script = join(directory, "native.mjs");
        await writeFile(
            script,
            [
                'import { createRequire } from "node:module";',
                'const imported = await import("condition-fixture");',
                'const required = createRequire(import.meta.url)("condition-fixture/require");',
                'const legacyNamespace = await import("legacy-fixture");',
                "const legacy = legacyNamespace.default ?? legacyNamespace;",
                'console.log("__CHECK_HOT_RESOLUTION__=" + JSON.stringify({ imported: imported.marker, required: required.marker, legacy: legacy.marker }));'
            ].join("\n")
        );
        const emptyBunfig = join(directory, "bunfig.toml");
        await writeFile(emptyBunfig, "");
        const argumentsValue =
            runtime === "deno"
                ? [
                      "run",
                      "--no-config",
                      "--node-modules-dir=manual",
                      `--allow-read=${directory}`,
                      script
                  ]
                : runtime === "bun"
                  ? ["--no-env-file", `--config=${emptyBunfig}`, script]
                  : [script];
        const native = spawnSync(executableFor(runtime), argumentsValue, {
            cwd: directory,
            encoding: "utf8",
            timeout: 10_000
        });
        expect(
            native.status,
            `${runtime} native resolver failed:\n${native.stderr}`
        ).toBe(0);
        const line = native.stdout
            .split(/\r?\n/u)
            .find(value => value.startsWith("__CHECK_HOT_RESOLUTION__="));
        expect(line).toBeDefined();
        const selected = JSON.parse(
            (line as string).slice("__CHECK_HOT_RESOLUTION__=".length)
        ) as { imported: string; required: string; legacy: string };

        expect(importReport.externalBoundaries).toContainEqual(
            expect.objectContaining({
                request: "condition-fixture",
                mode: "import",
                packageRelativeFile: selected.imported
            })
        );
        expect(requireReport.externalBoundaries).toContainEqual(
            expect.objectContaining({
                request: "condition-fixture/require",
                mode: "require",
                packageRelativeFile: selected.required
            })
        );
        expect(legacyReport.externalBoundaries).toContainEqual(
            expect.objectContaining({
                request: "legacy-fixture",
                mode: "import",
                packageRelativeFile: selected.legacy
            })
        );
    },
    30_000
);

test.each(availableRuntimes)(
    "matches %s native root and public-subpath artifact resolution",
    async runtime => {
        const directory = await mkdtemp(
            join(tmpdir(), "check-hot-public-resolution-")
        );
        directories.push(directory);
        const packageRoot = join(directory, "node_modules/public-fixture");
        await mkdir(packageRoot, { recursive: true });
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({ name: "public-resolution-host", type: "module" })
        );
        await writeFile(
            join(packageRoot, "package.json"),
            JSON.stringify({
                name: "public-fixture",
                version: "1.0.0",
                type: "module",
                exports: {
                    ".": {
                        deno: "./deno-root.js",
                        bun: "./bun-root.js",
                        node: "./node-root.js",
                        default: "./default-root.js"
                    },
                    "./feature": {
                        deno: "./deno-feature.js",
                        bun: "./bun-feature.js",
                        node: "./node-feature.js",
                        default: "./default-feature.js"
                    }
                }
            })
        );
        await Promise.all(
            ["deno", "bun", "node", "default"].flatMap(name => [
                writeMarkerModule(
                    join(packageRoot, `${name}-root.js`),
                    `${name}-root.js`
                ),
                writeMarkerModule(
                    join(packageRoot, `${name}-feature.js`),
                    `${name}-feature.js`
                )
            ])
        );

        const report = await analyzeHotModule({
            input: packageRoot,
            runtime
        });
        const script = join(directory, "native-public.mjs");
        await writeFile(
            script,
            [
                'const root = import.meta.resolve("public-fixture");',
                'const feature = import.meta.resolve("public-fixture/feature");',
                'const rootModule = await import("public-fixture");',
                'const featureModule = await import("public-fixture/feature");',
                'console.log("__CHECK_HOT_PUBLIC_RESOLUTION__=" + JSON.stringify({ root, feature, rootMarker: rootModule.marker, featureMarker: featureModule.marker }));'
            ].join("\n")
        );
        const emptyBunfig = join(directory, "bunfig.toml");
        await writeFile(emptyBunfig, "");
        const argumentsValue =
            runtime === "deno"
                ? [
                      "run",
                      "--no-config",
                      "--node-modules-dir=manual",
                      `--allow-read=${directory}`,
                      script
                  ]
                : runtime === "bun"
                  ? ["--no-env-file", `--config=${emptyBunfig}`, script]
                  : [script];
        const native = spawnSync(executableFor(runtime), argumentsValue, {
            cwd: directory,
            encoding: "utf8",
            timeout: 10_000
        });
        expect(
            native.status,
            `${runtime} native public resolver failed:\n${native.stderr}`
        ).toBe(0);
        const line = native.stdout
            .split(/\r?\n/u)
            .find(value =>
                value.startsWith("__CHECK_HOT_PUBLIC_RESOLUTION__=")
            );
        expect(line).toBeDefined();
        const selected = JSON.parse(
            (line as string).slice("__CHECK_HOT_PUBLIC_RESOLUTION__=".length)
        ) as {
            root: string;
            feature: string;
            rootMarker: string;
            featureMarker: string;
        };
        const rootPath = relative(
            packageRoot,
            fileURLToPath(selected.root)
        ).replaceAll("\\", "/");
        const featurePath = relative(
            packageRoot,
            fileURLToPath(selected.feature)
        ).replaceAll("\\", "/");

        expect(report.entryPackagePath).toBe(rootPath);
        expect(report.publicEntries).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    modulePath: ".",
                    entryPackagePath: rootPath
                }),
                expect.objectContaining({
                    modulePath: "./feature",
                    entryPackagePath: featurePath
                })
            ])
        );
        expect(selected.rootMarker).toBe(rootPath);
        expect(selected.featureMarker).toBe(featurePath);
    },
    30_000
);

test.runIf(runtimeAvailable("bun"))(
    "matches Bun's native local import, local require, and package extension priorities",
    async () => {
        const directory = await mkdtemp(
            join(tmpdir(), "check-hot-bun-resolution-")
        );
        directories.push(directory);
        await writeFile(
            join(directory, "package.json"),
            JSON.stringify({ name: "bun-extension-fixture", type: "module" })
        );
        const importEntry = join(directory, "import-entry.js");
        const requireEntry = join(directory, "require-entry.cjs");
        const packageRoot = join(directory, "node_modules/internal-fixture");
        await mkdir(packageRoot, { recursive: true });
        await writeFile(
            importEntry,
            'export { marker } from "./import-selected";'
        );
        await writeMarkerModule(
            join(directory, "import-selected.tsx"),
            "import-selected.tsx"
        );
        await writeMarkerModule(
            join(directory, "import-selected.jsx"),
            "import-selected.jsx"
        );
        await writeFile(
            requireEntry,
            'module.exports = require("./require-selected");'
        );
        await writeMarkerCommonJs(
            join(directory, "require-selected.cts"),
            "require-selected.cts"
        );
        await writeMarkerModule(
            join(directory, "require-selected.mts"),
            "require-selected.mts"
        );
        await writeFile(
            join(packageRoot, "package.json"),
            JSON.stringify({
                name: "internal-fixture",
                version: "1.0.0",
                type: "module",
                exports: "./entry.js"
            })
        );
        await writeFile(
            join(packageRoot, "entry.js"),
            'export { marker } from "./package-selected";'
        );
        await writeMarkerModule(
            join(packageRoot, "package-selected.js"),
            "package-selected.js"
        );
        await writeMarkerModule(
            join(packageRoot, "package-selected.ts"),
            "package-selected.ts"
        );
        const [importReport, requireReport, packageReport] = await Promise.all([
            analyzeHotModule({ input: importEntry, runtime: "bun" }),
            analyzeHotModule({ input: requireEntry, runtime: "bun" }),
            analyzeHotModule({ input: packageRoot, runtime: "bun" })
        ]);
        const emptyBunfig = join(directory, "bunfig.toml");
        await writeFile(emptyBunfig, "");
        const script = join(directory, "native-bun-priority.mjs");
        await writeFile(
            script,
            [
                'import { createRequire } from "node:module";',
                'const imported = await import("./import-entry.js");',
                'const required = createRequire(import.meta.url)("./require-entry.cjs");',
                'const packageValue = await import("internal-fixture");',
                'console.log("__CHECK_HOT_BUN_PRIORITY__=" + JSON.stringify({ imported: imported.marker, required: required.marker, package: packageValue.marker }));'
            ].join("\n")
        );
        const native = spawnSync(
            "bun",
            ["--no-env-file", `--config=${emptyBunfig}`, script],
            { cwd: directory, encoding: "utf8", timeout: 10_000 }
        );

        expect(native.status, native.stderr).toBe(0);
        const line = native.stdout
            .split(/\r?\n/u)
            .find(value => value.startsWith("__CHECK_HOT_BUN_PRIORITY__="));
        expect(line).toBeDefined();
        const selected = JSON.parse(
            (line as string).slice("__CHECK_HOT_BUN_PRIORITY__=".length)
        ) as { imported: string; required: string; package: string };
        expect(
            importReport.sourceGraph.map(source => source.relativeFile)
        ).toContain(selected.imported);
        expect(
            requireReport.sourceGraph.map(source => source.relativeFile)
        ).toContain(selected.required);
        expect(
            packageReport.sourceGraph.map(source => source.relativeFile)
        ).toContain(selected.package);
        expect(selected).toEqual({
            imported: "import-selected.tsx",
            required: "require-selected.cts",
            package: "package-selected.js"
        });
    },
    30_000
);

test.runIf(runtimeAvailable("bun"))(
    "does not apply Bun's local .mjs-to-.mts alias inside node_modules",
    async () => {
        const directory = await mkdtemp(
            join(tmpdir(), "check-hot-bun-mjs-resolution-")
        );
        directories.push(directory);
        const packageRoot = join(directory, "node_modules/mjs-fixture");
        await mkdir(packageRoot, { recursive: true });
        await writeFile(
            join(packageRoot, "package.json"),
            JSON.stringify({
                name: "mjs-fixture",
                version: "1.0.0",
                type: "module",
                exports: "./entry.js"
            })
        );
        await writeFile(
            join(packageRoot, "entry.js"),
            'export { marker } from "./selected.mjs";'
        );
        await writeMarkerModule(
            join(packageRoot, "selected.mts"),
            "selected.mts"
        );

        const report = await analyzeHotModule({
            input: packageRoot,
            runtime: "bun"
        });
        const script = join(directory, "native-mjs.mjs");
        const emptyBunfig = join(directory, "bunfig.toml");
        await writeFile(script, 'await import("mjs-fixture");');
        await writeFile(emptyBunfig, "");
        const native = spawnSync(
            "bun",
            ["--no-env-file", `--config=${emptyBunfig}`, script],
            { cwd: directory, encoding: "utf8", timeout: 10_000 }
        );
        expect(report.graphComplete).toBe(false);
        expect(
            report.sourceGraph.map(source => source.relativeFile)
        ).not.toContain("selected.mts");
        expect(native.status).not.toBe(0);
    },
    30_000
);
