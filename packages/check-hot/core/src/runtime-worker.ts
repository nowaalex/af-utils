import { existsSync } from "node:fs";
import { sep } from "node:path";
import { fileURLToPath } from "node:url";

/** Core-owned Bun config that disables ambient preload/loader/install state. */
export const bunWorkerConfigPath = fileURLToPath(
    new URL("./runtime/bunfig.toml", import.meta.url)
);

/** Prefer built runtime workers, falling back to TypeScript only for Node/tsx. */
export const resolveRuntimeWorker = (compiledUrl: URL) => {
    const adjacentCompiled = fileURLToPath(compiledUrl);
    if (existsSync(adjacentCompiled)) return adjacentCompiled;
    const sourceSegment = `${sep}src${sep}`;
    const distributionSegment = `${sep}dist${sep}`;
    const builtFromSource = adjacentCompiled.includes(sourceSegment)
        ? adjacentCompiled.replace(sourceSegment, distributionSegment)
        : adjacentCompiled;
    if (existsSync(builtFromSource)) return builtFromSource;
    return adjacentCompiled.replace(/\.js$/u, ".ts");
};
