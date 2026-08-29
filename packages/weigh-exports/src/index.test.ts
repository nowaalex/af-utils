import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, test } from "vitest";

const execFileAsync = promisify(execFile);
const cliPath = fileURLToPath(new URL("../dist/index.js", import.meta.url));
const temporaryDirectories: string[] = [];

const createPackage = async (
    root: string,
    name: string,
    exports: unknown,
    files: Readonly<Record<string, string>>
) => {
    await mkdir(root, { recursive: true });
    await writeFile(
        join(root, "package.json"),
        JSON.stringify({ name, exports }),
        "utf8"
    );
    await Promise.all(
        Object.entries(files).map(async ([path, content]) => {
            const filePath = join(root, path);
            await mkdir(join(filePath, ".."), { recursive: true });
            await writeFile(filePath, content, "utf8");
        })
    );
};

const readGeneratedOutput = async (path: string) => {
    const source = await readFile(path, "utf8");
    const prefix = "export default ";
    const suffix = " as const;";
    const start = source.indexOf(prefix);
    return JSON.parse(source.slice(start + prefix.length, -suffix.length));
};

const runCli = (cwd: string, input: string, output: string) =>
    execFileAsync(
        process.execPath,
        [cliPath, "--input", input, "--output", output, "--quiet"],
        { cwd }
    );

afterEach(async () => {
    await Promise.all(
        temporaryDirectories
            .splice(0)
            .map(path => rm(path, { force: true, recursive: true }))
    );
});

describe("weigh-exports CLI", () => {
    test("writes a bare output filename without crawling nested directories", async () => {
        const root = await mkdtemp(join(tmpdir(), "weigh-exports-output-"));
        temporaryDirectories.push(root);
        const packageRoot = join(root, "package");
        await createPackage(packageRoot, "fixture-package", "./dist/index.js", {
            "dist/index.js": "export const value = 1;"
        });
        await createPackage(
            join(packageRoot, "node_modules/nested-package"),
            "nested-package",
            "./dist/index.js",
            { "dist/index.js": "export const nested = true;" }
        );

        await runCli(root, packageRoot, "bundle-sizes.ts");

        const output = await readGeneratedOutput(join(root, "bundle-sizes.ts"));
        expect(Object.keys(output)).toEqual(["fixture-package"]);
        expect(output["fixture-package"]).toHaveProperty("./dist/index.js");
    });

    test("expands wildcard exports and measures a node-only condition", async () => {
        const root = await mkdtemp(join(tmpdir(), "weigh-exports-pattern-"));
        temporaryDirectories.push(root);
        const packageRoot = join(root, "package");
        await createPackage(
            packageRoot,
            "node-pattern-package",
            {
                types: "./dist/index.d.ts",
                node: "./dist/*.js"
            },
            {
                "dist/feature.js": "export const feature = true;",
                "dist/index.js": "export const value = 1;"
            }
        );

        await runCli(root, packageRoot, "generated/output.ts");

        const output = await readGeneratedOutput(
            join(root, "generated/output.ts")
        );
        expect(Object.keys(output["node-pattern-package"]).toSorted()).toEqual([
            "./dist/feature.js",
            "./dist/index.js"
        ]);
    });
});
