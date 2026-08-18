import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const rootDirectory = resolve(import.meta.dirname, "..");
const checkOnly = process.argv.includes("--check");
const unknownArguments = process.argv
    .slice(2)
    .filter(argument => argument !== "--check");
const dependencyFields = [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies"
];
const ignoredDirectories = new Set([
    ".git",
    ".stryker-tmp",
    ".vite",
    "coverage",
    "dist",
    "node_modules"
]);

if (unknownArguments.length > 0) {
    console.error(`Unknown argument(s): ${unknownArguments.join(", ")}`);
    process.exit(1);
}

const findPackageManifests = async directory => {
    const entries = (
        await readdir(directory, { withFileTypes: true })
    ).toSorted((left, right) => left.name.localeCompare(right.name));

    return (
        await Promise.all(
            entries.map(entry => {
                const entryPath = join(directory, entry.name);

                if (
                    entry.isDirectory() &&
                    !ignoredDirectories.has(entry.name)
                ) {
                    return findPackageManifests(entryPath);
                }
                return entry.isFile() && entry.name === "package.json"
                    ? [entryPath]
                    : [];
            })
        )
    ).flat();
};

const readManifest = async manifestPath =>
    JSON.parse(await readFile(manifestPath, "utf8"));

const publicPackages = new Map();

const packageManifests = await Promise.all(
    (await findPackageManifests(join(rootDirectory, "packages"))).map(
        async manifestPath => ({
            manifest: await readManifest(manifestPath),
            manifestPath
        })
    )
);

for (const { manifest } of packageManifests) {
    if (manifest.private === true || !manifest.name || !manifest.version) {
        continue;
    }

    if (publicPackages.has(manifest.name)) {
        throw new Error(`Duplicate public package name: ${manifest.name}`);
    }

    publicPackages.set(manifest.name, manifest.version);
}

const problems = [];
const updatedManifests = [];

const exampleManifests = await Promise.all(
    (await findPackageManifests(join(rootDirectory, "examples", "src"))).map(
        async manifestPath => ({
            manifest: await readManifest(manifestPath),
            manifestPath
        })
    )
);

for (const { manifest, manifestPath } of exampleManifests) {
    const displayPath = relative(rootDirectory, manifestPath);
    let changed = false;

    if (manifest.private !== true) {
        problems.push(
            `${displayPath}: example packages must have "private": true`
        );
    }

    for (const field of dependencyFields) {
        const dependencies = manifest[field];

        if (!dependencies) {
            continue;
        }

        for (const [packageName, currentVersion] of Object.entries(
            dependencies
        )) {
            const expectedVersion = publicPackages.get(packageName);

            if (expectedVersion && currentVersion !== expectedVersion) {
                if (checkOnly) {
                    problems.push(
                        `${displayPath}: ${field}.${packageName} is ${currentVersion}, expected ${expectedVersion}`
                    );
                } else {
                    dependencies[packageName] = expectedVersion;
                    changed = true;
                }
            } else if (/^(?:file|link|workspace):/u.test(currentVersion)) {
                problems.push(
                    `${displayPath}: ${field}.${packageName} uses ${currentVersion}, which is not portable outside the monorepo`
                );
            }
        }
    }

    if (changed) {
        updatedManifests.push({ manifest, manifestPath });
    }
}

if (problems.length > 0) {
    console.error(problems.join("\n"));

    if (checkOnly) {
        console.error(
            "Run `pnpm nx run @af-utils/examples:versions` to synchronize local package versions."
        );
    }

    process.exit(1);
}

await Promise.all(
    updatedManifests.map(({ manifest, manifestPath }) =>
        writeFile(manifestPath, `${JSON.stringify(manifest, null, 4)}\n`)
    )
);

if (updatedManifests.length > 0) {
    console.log(
        `Updated public package versions in ${updatedManifests.length} example manifest(s).`
    );
}

if (checkOnly) {
    console.log(
        "Example package manifests satisfy the standalone sandbox contract."
    );
}
