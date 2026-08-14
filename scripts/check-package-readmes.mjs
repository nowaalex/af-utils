import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, relative } from "node:path";

const pnpmArgs = ["list", "--recursive", "--depth", "-1", "--json"];
const workspaceJson = execFileSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    pnpmArgs,
    { encoding: "utf8" }
);
const workspacePackages = JSON.parse(workspaceJson);
const missingReadmes = workspacePackages
    .filter(
        workspacePackage =>
            !existsSync(join(workspacePackage.path, "README.md"))
    )
    .map(workspacePackage => relative(process.cwd(), workspacePackage.path));

if (missingReadmes.length > 0) {
    throw new Error(
        `Workspace packages missing README.md:\n${missingReadmes
            .map(path => `- ${path || "."}`)
            .join("\n")}`
    );
}

console.log(
    `Every workspace package has a README.md (${workspacePackages.length} checked).`
);
