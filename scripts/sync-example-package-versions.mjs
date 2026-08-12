import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
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
    const entries = await readdir(directory, { withFileTypes: true });
    const manifests = [];

    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
        const entryPath = join(directory, entry.name);

        if (entry.isDirectory()) {
            if (!ignoredDirectories.has(entry.name)) {
                manifests.push(...(await findPackageManifests(entryPath)));
            }
        } else if (entry.isFile() && entry.name === "package.json") {
            manifests.push(entryPath);
        }
    }

    return manifests;
};

const readManifest = async manifestPath =>
    JSON.parse(await readFile(manifestPath, "utf8"));

const publicPackages = new Map();

for (const manifestPath of await findPackageManifests(
    join(rootDirectory, "packages")
)) {
    const manifest = await readManifest(manifestPath);

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

for (const manifestPath of await findPackageManifests(
    join(rootDirectory, "examples", "src")
)) {
    const manifest = await readManifest(manifestPath);
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
            } else if (/^(?:file|link|workspace):/.test(currentVersion)) {
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
            "Run `pnpm examples:versions` to synchronize local package versions."
        );
    }

    process.exit(1);
}

for (const { manifest, manifestPath } of updatedManifests) {
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 4)}\n`);
}

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
