import { access, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { findFiles } from "./file-discovery.mjs";

const referenceDirectory = resolve("website/.generated/reference");
const navigationPath = resolve(referenceDirectory, "navigation.json");
const bundleSizesPath = resolve("website/.generated/bundleSizes.ts");
await access(bundleSizesPath);

const bundleSizesSource = await readFile(bundleSizesPath, "utf8");
const packageNamesPrefix = "// Package names: ";
const packageNamesLine = bundleSizesSource
    .split("\n")
    .find(line => line.startsWith(packageNamesPrefix));
if (!packageNamesLine) {
    throw new Error("Generated bundle sizes are missing package metadata");
}
const bundleSizePackageNames = JSON.parse(
    packageNamesLine.slice(packageNamesPrefix.length)
);
const packageManifests = await Promise.all(
    (await findFiles(resolve("packages"), "**/package.json")).map(
        async manifestPath => ({
            manifest: JSON.parse(await readFile(manifestPath, "utf8")),
            manifestPath
        })
    )
);
const publicPackages = packageManifests.filter(
    ({ manifest }) => manifest.private !== true
);
const unmeasurablePackages = publicPackages.filter(
    ({ manifest }) => !manifest.exports
);
if (unmeasurablePackages.length > 0) {
    throw new Error(
        unmeasurablePackages
            .map(
                ({ manifest, manifestPath }) =>
                    `Public package cannot produce bundle sizes because it has no exports: ${manifest.name} (${relative(resolve(), manifestPath)})`
            )
            .join("\n")
    );
}
const publicPackageNames = new Set(
    publicPackages.map(({ manifest }) => manifest.name)
);
const generatedPackageNames = new Set(bundleSizePackageNames);
if (generatedPackageNames.size !== bundleSizePackageNames.length) {
    throw new Error("Generated bundle sizes contain duplicate package names");
}
const missingBundleSizes = [...publicPackageNames].filter(
    name => !generatedPackageNames.has(name)
);
const unexpectedBundleSizes = [...generatedPackageNames].filter(
    name => !publicPackageNames.has(name)
);
if (missingBundleSizes.length > 0 || unexpectedBundleSizes.length > 0) {
    throw new Error(
        [
            ...missingBundleSizes.map(name => `Missing bundle sizes: ${name}`),
            ...unexpectedBundleSizes.map(
                name => `Unexpected bundle sizes: ${name}`
            )
        ].join("\n")
    );
}

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
    `Generated website artifacts are complete (${actualPages.size} reference pages, ${generatedPackageNames.size} bundle-size packages).`
);
