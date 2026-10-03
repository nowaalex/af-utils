import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "vitest";

test("resolves built workers relative to the package when an ancestor is named src", async () => {
    const directory = await mkdtemp(join(tmpdir(), "check-hot-worker-"));
    try {
        const packageRoot = join(directory, "src", "fixture-package");
        const sourceRoot = join(packageRoot, "src");
        const distRoot = join(packageRoot, "dist");
        await mkdir(join(sourceRoot, "workers"), { recursive: true });
        await mkdir(join(distRoot, "workers"), { recursive: true });
        const resolverPath = join(sourceRoot, "runtime-worker.mjs");
        await copyFile(
            new URL("../dist/runtime-worker.js", import.meta.url),
            resolverPath
        );
        const { resolveRuntimeWorker } = await import(
            pathToFileURL(resolverPath).href
        );
        const sourceWorker = join(sourceRoot, "workers", "probe.js");
        const compiledWorker = join(distRoot, "workers", "probe.js");
        const requestedWorker = pathToFileURL(sourceWorker);

        expect(resolveRuntimeWorker(requestedWorker)).toBe(
            join(sourceRoot, "workers", "probe.ts")
        );
        await writeFile(compiledWorker, "export {};\n");
        expect(resolveRuntimeWorker(requestedWorker)).toBe(compiledWorker);
        await writeFile(sourceWorker, "export {};\n");
        expect(resolveRuntimeWorker(requestedWorker)).toBe(sourceWorker);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});
