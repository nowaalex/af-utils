import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const failures = [];

const readJson = path => JSON.parse(readFileSync(path, "utf8"));

const manifestPaths = [];
const visit = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.name === "node_modules") continue;
        const path = join(directory, entry.name);
        if (entry.isDirectory()) visit(path);
        else if (entry.name === "package.json") manifestPaths.push(path);
    }
};

for (const directory of ["packages", "examples", "website"]) {
    visit(join(root, directory));
}

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
    "bench",
    "jit:check",
    "typecheck",
    "packages:build",
    "build",
    "publint",
    "packages:readmes:check",
    "site:sync",
    "site:sync:check",
    "examples:build",
    "examples:sync",
    "examples:sync:check",
    "workspace:sync",
    "workspace:sync:check",
    "website:generated:check",
    "nx:contracts:check"
];
for (const name of nxAliases) {
    if (!rootManifest.scripts?.[name]?.includes("nx ")) {
        failures.push(`root script ${name} must delegate to Nx`);
    }
}

for (const workflow of [
    ".github/workflows/ci.yml",
    ".github/workflows/release.yml"
]) {
    const content = readFileSync(join(root, workflow), "utf8");
    for (const line of content.split("\n")) {
        const command = line.match(/^\s*run:\s*(pnpm .+)$/u)?.[1];
        if (
            command &&
            !command.startsWith("pnpm nx ") &&
            !command.startsWith("pnpm install ") &&
            !command.startsWith("pnpm i ") &&
            !command.startsWith("pnpm exec playwright install ")
        ) {
            failures.push(`${workflow} bypasses Nx with: ${command}`);
        }
    }
}

if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
} else {
    console.log(
        `Nx workspace contract passed for ${manifestPaths.length} projects and ${publicPackages} publishable packages`
    );
}
