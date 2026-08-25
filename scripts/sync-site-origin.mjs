import {
    readdirSync,
    readFileSync,
    renameSync,
    rmSync,
    writeFileSync
} from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const ignoredDirectories = new Set([
    ".astro",
    ".git",
    ".nx",
    ".stryker-tmp",
    "coverage",
    "dist",
    "git-worktrees",
    "node_modules",
    "playwright-report",
    "test-results"
]);
const textExtensions = new Set([
    ".astro",
    ".css",
    ".env",
    ".html",
    ".js",
    ".json",
    ".jsx",
    ".md",
    ".mdx",
    ".mjs",
    ".svelte",
    ".ts",
    ".tsx",
    ".txt",
    ".yaml",
    ".yml"
]);
const textFileNames = new Set([".env.local", ".npmrc"]);
const afUtilsOriginPattern = /https?:\/\/af-utils(?:\.[a-z\d-]+)+/giu;
let temporaryFileSequence = 0;

export const normalizeSiteOrigin = value => {
    if (typeof value !== "string") {
        throw new TypeError("site.config.json origin must be a string");
    }

    const url = new URL(value);
    if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.pathname !== "/" ||
        url.search ||
        url.hash ||
        value !== url.origin
    ) {
        throw new TypeError(
            "site.config.json origin must be a canonical HTTPS origin without a trailing slash, path, query, credentials, or fragment"
        );
    }

    return url.origin;
};

export const rewriteSiteOrigins = (content, siteOrigin) =>
    content.replace(afUtilsOriginPattern, origin =>
        origin === siteOrigin ? origin : siteOrigin
    );

export const findUnexpectedSiteOrigins = (content, siteOrigin) =>
    [...content.matchAll(afUtilsOriginPattern)]
        .map(match => match[0])
        .filter(origin => origin !== siteOrigin);

export const replaceFileAtomically = (
    path,
    content,
    {
        renameFile = renameSync,
        removeFile = rmSync,
        writeFile = writeFileSync
    } = {}
) => {
    const temporaryPath = join(
        dirname(path),
        `.${basename(path)}.site-origin-${process.pid}-${temporaryFileSequence++}.tmp`
    );

    try {
        writeFile(temporaryPath, content, { encoding: "utf8", flag: "wx" });
        renameFile(temporaryPath, path);
    } catch (error) {
        try {
            removeFile(temporaryPath, { force: true });
        } catch {
            // The original write error is more useful; a stale .tmp is ignored.
        }
        throw error;
    }
};

const collectTextFiles = directory => {
    const files = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectTextFiles(path));
        } else if (
            entry.isFile() &&
            (textExtensions.has(extname(entry.name)) ||
                textFileNames.has(entry.name))
        ) {
            files.push(path);
        }
    }
    return files;
};

export const synchronizeSiteOrigin = ({
    rootDirectory = root,
    check = false,
    replaceFile = replaceFileAtomically
} = {}) => {
    const siteConfig = JSON.parse(
        readFileSync(join(rootDirectory, "site.config.json"), "utf8")
    );
    const siteOrigin = normalizeSiteOrigin(siteConfig.origin);
    const pending = [];
    const updates = [];

    for (const path of collectTextFiles(rootDirectory)) {
        const content = readFileSync(path, "utf8");
        const synchronized = rewriteSiteOrigins(content, siteOrigin);

        if (synchronized !== content) {
            pending.push(path.slice(rootDirectory.length + 1));
            updates.push([path, synchronized]);
        }
    }
    if (check && pending.length > 0) {
        throw new Error(
            `Site origin is not synchronized in:\n${pending.join("\n")}`
        );
    }
    if (!check) {
        for (const [path, content] of updates) replaceFile(path, content);
    }

    console.log(
        check
            ? `Site origin is synchronized to ${siteOrigin}`
            : `Synchronized ${pending.length} files to ${siteOrigin}`
    );

    return { pending, siteOrigin };
};

const main = () => {
    const args = process.argv.slice(2);
    const check = args.length === 1 && args[0] === "--check";
    if (!check && args.length > 0) {
        throw new TypeError("Usage: sync-site-origin.mjs [--check]");
    }

    synchronizeSiteOrigin({ check });
};

if (process.argv[1] === import.meta.filename) main();
