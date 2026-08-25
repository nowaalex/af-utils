import { access, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { findFiles } from "./file-discovery.mjs";

const referenceDirectory = resolve("website/.generated/reference");
const navigationPath = resolve(referenceDirectory, "navigation.json");
await access(resolve("website/.generated/bundleSizes.ts"));

const navigation = JSON.parse(await readFile(navigationPath, "utf8"));
const expectedPages = new Set(["index.md"]);
const collectPages = items => {
    for (const item of items) {
        if (item.path) expectedPages.add(`${item.path}.md`);
        collectPages(item.children ?? []);
    }
};
collectPages(navigation);

const actualPages = new Set(
    (await findFiles(referenceDirectory, "**/*.md")).map(path =>
        relative(referenceDirectory, path).replaceAll("\\", "/")
    )
);
const missingPages = [...expectedPages].filter(path => !actualPages.has(path));
const unexpectedPages = [...actualPages].filter(
    path => !expectedPages.has(path)
);

if (missingPages.length > 0 || unexpectedPages.length > 0) {
    throw new Error(
        [
            ...missingPages.map(path => `Missing generated page: ${path}`),
            ...unexpectedPages.map(path => `Unexpected generated page: ${path}`)
        ].join("\n")
    );
}

console.log(
    `Generated website artifacts are complete (${actualPages.size} reference pages).`
);
