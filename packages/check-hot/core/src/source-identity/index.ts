import { createHash } from "node:crypto";
import { readFile, readdir, readlink } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";

import type { HotPackageTreeIdentity } from "../types.js";

const ignoredDirectories = new Set([".git", "node_modules"]);

const portableRelative = (root: string, file: string) =>
    relative(root, file).split(sep).join("/");

const isInsideRoot = (relativeFile: string) =>
    relativeFile !== ".." &&
    !relativeFile.startsWith("../") &&
    !relativeFile.startsWith("/");

const runtimeFileExtensions = new Set([
    ".cjs",
    ".css",
    ".cts",
    ".js",
    ".json5",
    ".jsx",
    ".mjs",
    ".mts",
    ".node",
    ".toml",
    ".ts",
    ".tsx",
    ".wasm",
    ".yaml",
    ".yml"
]);

const isResolverSensitiveFile = (file: string) =>
    runtimeFileExtensions.has(extname(file).toLowerCase()) ||
    /(?:^|\/)(?:package\.json|tsconfig(?:\.[^/]+)?\.json|jsconfig(?:\.[^/]+)?\.json|deno\.jsonc?|import[_-]map\.json|bun\.lock|deno\.lock|pnpm-lock\.yaml)$/u.test(
        file
    );

const compareCodeUnits = (left: string, right: string) =>
    left < right ? -1 : left > right ? 1 : 0;

/** Hash the complete target package tree, including its resolver inputs. */
export const createHotPackageTreeIdentity = async (
    root: string,
    ignoredAbsoluteFiles: readonly string[] = []
): Promise<HotPackageTreeIdentity> => {
    const ignoredRelativeFiles = ignoredAbsoluteFiles
        .map(file => portableRelative(root, resolve(file)))
        .filter(file => isInsideRoot(file))
        .toSorted(compareCodeUnits);
    const ignoredFiles = new Set(ignoredRelativeFiles);
    const rows: { relativeFile: string; sourceSha256: string }[] = [];
    const pending = [root];

    while (pending.length > 0) {
        const directory = pending.pop();
        if (!directory) continue;
        // oxlint-disable-next-line no-await-in-loop -- Tree hashing walks one bounded package and keeps file descriptors bounded.
        const entries = await readdir(directory, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
                continue;
            }
            const file = resolve(directory, entry.name);
            const relativeFile = portableRelative(root, file);
            if (ignoredFiles.has(relativeFile)) continue;
            if (entry.isDirectory()) {
                pending.push(file);
                continue;
            }
            if (entry.isSymbolicLink()) {
                // oxlint-disable-next-line no-await-in-loop -- A symlink target is part of the resolver-sensitive tree identity.
                const target = await readlink(file);
                rows.push({
                    relativeFile,
                    sourceSha256: createHash("sha256")
                        .update(`symlink:${target}`)
                        .digest("hex")
                });
                continue;
            }
            if (!isResolverSensitiveFile(relativeFile)) continue;
            if (!entry.isFile()) continue;
            // oxlint-disable-next-line no-await-in-loop -- Sequential reads avoid exhausting descriptors on large published packages.
            const content = await readFile(file);
            rows.push({
                relativeFile,
                sourceSha256: createHash("sha256").update(content).digest("hex")
            });
        }
    }

    rows.sort((left, right) =>
        compareCodeUnits(left.relativeFile, right.relativeFile)
    );
    const digest = createHash("sha256");
    for (const row of rows) {
        digest.update(row.relativeFile);
        digest.update("\0");
        digest.update(row.sourceSha256);
        digest.update("\0");
    }
    return {
        sourceSha256: digest.digest("hex"),
        fileCount: rows.length,
        ignoredRelativeFiles
    };
};
