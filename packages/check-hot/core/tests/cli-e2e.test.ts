import { spawnSync } from "node:child_process";
import {
    mkdir,
    mkdtemp,
    mkdtempDisposable,
    readFile,
    rm,
    symlink,
    writeFile
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

import { afterEach, describe, expect, test } from "vitest";

import { runHotSuite } from "../src/runner.js";
import { probeHotModule } from "../src/analyzer.js";

const directories: string[] = [];
const childProcessesAvailable =
    process.env.CODEX_PERMISSION_PROFILE === undefined &&
    spawnSync(process.execPath, ["--import=tsx", "-e", ""], {
        cwd: import.meta.dirname,
        stdio: "ignore"
    }).status === 0;
const externalProbeRuntimes = (["deno", "bun"] as const).filter(
    runtime =>
        spawnSync(runtime, ["--version"], { stdio: "ignore" }).status === 0
);

afterEach(async () => {
    await Promise.all(
        directories
            .splice(0)
            .map(directory => rm(directory, { force: true, recursive: true }))
    );
});

describe.runIf(childProcessesAvailable)("CLI local-package workflow", () => {
    test("documents and validates per-diagnostic stress budgets", () => {
        const cli = join(import.meta.dirname, "../dist/cli.js");
        const help = spawnSync(cli, ["--help"], {
            cwd: join(import.meta.dirname, ".."),
            encoding: "utf8"
        });
        const invalid = spawnSync(
            cli,
            ["run", "missing.mjs", "--diagnostic-stress", "cpu-profile=0"],
            {
                cwd: join(import.meta.dirname, ".."),
                encoding: "utf8"
            }
        );

        expect(help.status, help.stderr).toBe(0);
        expect(help.stdout).toContain("--diagnostic-stress");
        expect(invalid.status).toBe(1);
        expect(invalid.stderr).toContain(
            "diagnostic-stress cpu-profile must be a positive integer"
        );
    });

    test("rejects an output that cannot import the installed core", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-output-"));
        directories.push(directory);
        const cli = join(import.meta.dirname, "../dist/cli.js");
        const resolutionBlocker = join(directory, "block-core.cjs");
        await writeFile(
            resolutionBlocker,
            [
                'const Module = require("node:module");',
                "const resolveFilename = Module._resolveFilename;",
                "Module._resolveFilename = function (request, ...argumentsValue) {",
                '  if (request === "@af-utils/check-hot") {',
                '    const error = new Error("blocked core resolution for the negative control");',
                '    error.code = "MODULE_NOT_FOUND";',
                "    throw error;",
                "  }",
                "  return Reflect.apply(resolveFilename, this, [request, ...argumentsValue]);",
                "};"
            ].join("\n")
        );
        const result = spawnSync(
            process.execPath,
            [
                "--require",
                resolutionBlocker,
                cli,
                "init",
                ".",
                "--out",
                join(directory, "suite.mjs")
            ],
            {
                cwd: join(import.meta.dirname, ".."),
                encoding: "utf8"
            }
        );

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("cannot resolve @af-utils/check-hot");
    });

    test.each(externalProbeRuntimes)(
        "isolates declarative probes on %s and records its exact engine fingerprint",
        async runtime => {
            const directory = await mkdtemp(
                join(import.meta.dirname, `.probe-${runtime}-`)
            );
            directories.push(directory);
            const target = join(directory, "target.mjs");
            const runner = join(directory, "runner.mjs");
            await writeFile(
                target,
                "export function increment(value) { return value + 1; }"
            );
            await writeFile(
                runner,
                [
                    'const sample = { label: "number", args: () => [1], verify(value) { if (value !== 2) throw new Error("wrong result"); } };',
                    "export default {",
                    '  id: "portable-probe", version: "1.0.0", coveragePolicy: "seed-only",',
                    "  validate: () => [],",
                    '  listSamples: () => ({ increment: ["number"] }),',
                    "  createSamples: () => ({ increment: [sample] })",
                    "};"
                ].join("\n")
            );

            const manifest = await probeHotModule({
                specifier: pathToFileURL(target).href,
                parentUrl: import.meta.url,
                testRunnerSpecifier: pathToFileURL(runner).href,
                package: { name: "portable-fixture", version: "1.0.0" },
                runtime,
                timeoutMs: 10_000
            });

            expect(manifest.runtime).toMatchObject({
                name: runtime,
                engine: runtime === "bun" ? "jsc" : "v8"
            });
            expect(manifest.runtime.version).not.toBe("unknown");
            expect(manifest.attempts).toEqual([
                expect.objectContaining({ status: "accepted" })
            ]);
        },
        30_000
    );

    test("hard-kills one synchronous recipe and continues with the next coordinate", async () => {
        const directory = await mkdtemp(
            join(import.meta.dirname, ".probe-e2e-")
        );
        directories.push(directory);
        const target = join(directory, "target.mjs");
        const runner = join(directory, "runner.mjs");
        await writeFile(
            target,
            [
                'process.on("SIGTERM", () => {});',
                "export function hangs() { while (true) {} }",
                "export function returnsClosure() { return value => value + 1; }",
                "export function projectedClosure() { return value => value + 1; }",
                'export function noRecipe() { return "visible"; }',
                'export function afterHang() { return "continued"; }'
            ].join("\n")
        );
        await writeFile(
            runner,
            [
                'const call = { label: "call", args: () => [] };',
                'const samples = { hangs: call, returnsClosure: { ...call, verify(value) { if (typeof value !== "function") throw new TypeError("function expected"); } }, projectedClosure: { ...call, verify(value) { if (typeof value !== "function") throw new TypeError("function expected"); }, probeFingerprint({ result }) { return result(2); } }, afterHang: { ...call, verify(value) { if (typeof value !== "string") throw new TypeError("string expected"); } } };',
                "export default {",
                '  id: "hard-timeout", version: "1.0.0", coveragePolicy: "seed-only", perSampleTimeoutMs: 20,',
                "  validate: () => [],",
                '  listSamples: () => ({ hangs: ["call"], returnsClosure: ["call"], projectedClosure: ["call"], afterHang: ["call"] }),',
                "  createSamples: (_context, selected) => Object.fromEntries(Object.keys(selected).map(name => [name, [samples[name]]]))",
                "};"
            ].join("\n")
        );

        const manifest = await probeHotModule({
            specifier: pathToFileURL(target).href,
            parentUrl: import.meta.url,
            testRunnerSpecifier: pathToFileURL(runner).href,
            package: { name: "hard-timeout-fixture", version: "1.0.0" },
            runtime: "node",
            concurrency: 2,
            timeoutMs: 5_000
        });

        expect(manifest.attempts).toEqual([
            expect.objectContaining({
                functionName: "hangs",
                status: "timed-out"
            }),
            expect.objectContaining({
                functionName: "returnsClosure",
                status: "unsupported"
            }),
            expect.objectContaining({
                functionName: "projectedClosure",
                status: "accepted"
            }),
            expect.objectContaining({
                functionName: "afterHang",
                status: "accepted"
            })
        ]);
        expect(manifest.samples).toEqual({
            projectedClosure: ["call"],
            afterHang: ["call"]
        });

        const filtered = await probeHotModule({
            specifier: pathToFileURL(target).href,
            parentUrl: import.meta.url,
            testRunnerSpecifier: pathToFileURL(runner).href,
            package: { name: "hard-timeout-fixture", version: "1.0.0" },
            runtime: "node",
            functions: ["afterHang"],
            timeoutMs: 5_000
        });
        expect(filtered.attempts).toEqual([
            expect.objectContaining({
                functionName: "afterHang",
                status: "accepted"
            })
        ]);
        expect(filtered.samples).toEqual({ afterHang: ["call"] });

        await expect(
            probeHotModule({
                specifier: pathToFileURL(target).href,
                parentUrl: import.meta.url,
                testRunnerSpecifier: pathToFileURL(runner).href,
                package: {
                    name: "hard-timeout-fixture",
                    version: "1.0.0"
                },
                runtime: "node",
                functions: ["noRecipe"],
                timeoutMs: 5_000
            })
        ).rejects.toThrow(
            "provided no recipes for requested function(s): noRecipe"
        );
    }, 30_000);

    test("generates outside the target package, probes its public export, and runs the suite", async () => {
        await using disposableDirectory = await mkdtempDisposable(
            join(tmpdir(), "check-hot-cli-e2e-")
        );
        const directory = disposableDirectory.path;
        const target = join(directory, "target");
        const output = join(directory, "generated", "suite.mjs");
        const runner = join(directory, "runner.mjs");
        const dependencyScope = join(directory, "node_modules/@af-utils");
        await mkdir(dependencyScope, { recursive: true });
        await symlink(
            join(import.meta.dirname, ".."),
            join(dependencyScope, "check-hot"),
            "junction"
        );
        await mkdir(target);
        await writeFile(
            join(target, "package.json"),
            JSON.stringify({
                name: "check-hot-local-fixture",
                version: "1.0.0",
                type: "module",
                exports: "./index.ts"
            })
        );
        await writeFile(
            join(target, "index.ts"),
            "export function increment(value: number) { return Number(value) + 1; }"
        );
        await writeFile(
            runner,
            [
                "const sample = {",
                '  label: "fractional-number",',
                "  args: () => [1.25],",
                '  verify(result) { if (typeof result !== "number") throw new TypeError("expected number"); }',
                "};",
                "export default {",
                '  id: "local-e2e", version: "1.0.0", coveragePolicy: "seed-only",',
                "  validate: () => [],",
                "  listSamples: () => ({ increment: [sample.label] }),",
                "  createSamples: () => ({ increment: [sample] })",
                "};"
            ].join("\n")
        );

        const cli = join(import.meta.dirname, "../dist/cli.js");
        const init = spawnSync(
            cli,
            [
                "init",
                target,
                "--probe",
                "--probe-runtime",
                "node",
                "--test-runner",
                runner,
                "--out",
                output
            ],
            {
                cwd: join(import.meta.dirname, ".."),
                encoding: "utf8"
            }
        );
        expect(init.status, init.stderr).toBe(0);
        const source = await readFile(output, "utf8");
        expect(source).toContain("../target/index.ts");
        expect(source).not.toContain(
            'import.meta.resolve("check-hot-local-fixture")'
        );
        expect(source).toContain('"sourceLoader": "tsx"');
        expect(source).not.toContain(
            'const moduleSpecifier = "check-hot-local-fixture"'
        );

        const summary = await runHotSuite({
            suite: output,
            runtimes: ["node"],
            v8Tiers: ["turbofan"],
            modes: ["combined"],
            repetitions: 1,
            warmupIterations: 500,
            stressIterations: 100,
            deoptScope: "none",
            timeoutMs: 20_000
        });

        expect(summary.runs).toHaveLength(1);
        expect(
            summary.runs[0].worker,
            `${summary.runs[0].problems.map(problem => problem.message).join("\n")}\n${summary.runs[0].stderr}`
        ).toBeDefined();
        expect(summary.runs[0].worker?.adapter).toMatchObject({
            id: "local-e2e",
            probeRuntime: "node"
        });
    }, 60_000);

    test("probes and measures same-named functions from root and public subpath", async () => {
        const directory = await mkdtemp(
            join(import.meta.dirname, ".multi-entry-")
        );
        directories.push(directory);
        const target = join(directory, "target");
        const output = join(directory, "generated", "suite.mjs");
        const runner = join(directory, "runner.mjs");
        await mkdir(target);
        await writeFile(
            join(target, "package.json"),
            JSON.stringify({
                name: "check-hot-multi-entry",
                version: "1.0.0",
                type: "module",
                exports: {
                    ".": "./index.js",
                    "./feature": "./feature.js"
                }
            })
        );
        await writeFile(
            join(target, "index.js"),
            "export function increment(value) { return value + 1; }"
        );
        await writeFile(
            join(target, "feature.js"),
            "export function increment(value) { return value + 1; }\nexport const nested = { increment(value) { return value + 1; } };"
        );
        await writeFile(
            runner,
            [
                "const sample = {",
                '  label: "number", args: () => [1],',
                '  verify(result) { if (typeof result !== "number") throw new TypeError("expected number"); },',
                '  verifyMutation({ args, result }) { const expected = args[0] + 1; if (!Object.is(result, expected)) throw new Error("wrong result"); }',
                "};",
                "export default {",
                '  id: "multi-entry", version: "1.0.0", coveragePolicy: "seed-only",',
                "  validate: () => [],",
                '  discover: context => Object.hasOwn(context.namespace, "nested") ? [{ modulePath: "./feature", exportPath: ["nested", "increment"] }] : [],',
                '  listSamples: context => Object.fromEntries([...context.functions].map(([name]) => [name, ["number"]])),',
                "  createSamples: (_context, selected) => Object.fromEntries(Object.keys(selected).map(name => [name, [sample]]))",
                "};"
            ].join("\n")
        );

        const cli = join(import.meta.dirname, "../dist/cli.js");
        const init = spawnSync(
            cli,
            [
                "init",
                target,
                "--probe",
                "--probe-runtime",
                "node",
                "--test-runner",
                runner,
                "--out",
                output
            ],
            {
                cwd: join(import.meta.dirname, ".."),
                encoding: "utf8"
            }
        );
        expect(init.status, init.stderr).toBe(0);
        const source = await readFile(output, "utf8");
        expect(source).toContain('"modulePath": "./feature"');
        expect(source).toContain('"./feature::increment"');
        expect(source).toContain('"./feature::nested/increment"');

        const summary = await runHotSuite({
            suite: output,
            runtimes: ["node"],
            v8Tiers: ["turbofan"],
            modes: ["combined"],
            repetitions: 1,
            warmupIterations: 500,
            stressIterations: 100,
            deoptScope: "none",
            timeoutMs: 20_000
        });

        expect(summary.runs).toHaveLength(1);
        expect(
            summary.runs[0].worker,
            `${summary.runs[0].problems.map(problem => problem.message).join("\n")}\n${summary.runs[0].stderr}`
        ).toBeDefined();
        expect(summary.runs[0].worker?.scenarios).toEqual(
            expect.arrayContaining([
                "increment:number",
                "./feature::increment:number",
                "./feature::nested/increment:number"
            ])
        );
        expect(
            summary.runs[0].worker?.coverage.filter(
                entry => entry.status === "blocked"
            )
        ).toEqual([]);
    }, 60_000);
});
