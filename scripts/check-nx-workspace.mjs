import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { findFiles, findPackageManifests } from "./file-discovery.mjs";

const root = process.cwd();
const failures = [];

const readJson = path => JSON.parse(readFileSync(path, "utf8"));

const manifestPaths = await findPackageManifests(root, [
    "packages",
    "examples",
    "website"
]);

let publicPackages = 0;
for (const path of manifestPaths) {
    const manifest = readJson(path);
    for (const [name, command] of Object.entries(manifest.scripts ?? {})) {
        if (/\bpnpm\b/u.test(command)) {
            failures.push(
                `${relative(root, path)} script ${name} orchestrates through pnpm instead of Nx`
            );
        }
    }
    if (path.startsWith(join(root, "packages")) && manifest.private !== true) {
        publicPackages += 1;
        if (manifest.scripts?.publint !== "publint") {
            failures.push(
                `${relative(root, path)} must expose publint as an Nx project target`
            );
        }
    }
}

const rootManifest = readJson(join(root, "package.json"));
const nxAliases = [
    "format",
    "format:oxc",
    "format:templates",
    "format:check",
    "format:check:oxc",
    "format:check:templates",
    "lint",
    "check:style",
    "test",
    "test:e2e",
    "test:mutation",
    "test:mutation:full",
    "bench",
    "jit:check",
    "typecheck",
    "packages:build",
    "build",
    "publint",
    "packages:readmes:check",
    "examples:build",
    "examples:sync",
    "examples:sync:check",
    "workspace:sync",
    "workspace:sync:check",
    "website:generated:check",
    "website:lighthouse",
    "nx:contracts:check"
];
for (const name of nxAliases) {
    if (!rootManifest.scripts?.[name]?.includes("nx ")) {
        failures.push(`root script ${name} must delegate to Nx`);
    }
}

const workflows = await findFiles(root, [
    ".github/workflows/*.yml",
    ".github/workflows/*.yaml"
]);
for (const workflow of workflows) {
    const content = readFileSync(workflow, "utf8");
    const displayPath = relative(root, workflow);
    for (const line of content.split("\n")) {
        const command = line.match(/^\s*run:\s*(pnpm .+)$/u)?.[1];
        if (
            command &&
            !command.startsWith("pnpm nx ") &&
            !command.startsWith("pnpm install ") &&
            !command.startsWith("pnpm i ") &&
            !command.startsWith("pnpm exec playwright install ")
        ) {
            failures.push(`${displayPath} bypasses Nx with: ${command}`);
        }
    }
}

if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
} else {
    console.log(
        `Nx workspace contract passed for ${manifestPaths.length} manifests and ${publicPackages} publishable packages`
    );
}
