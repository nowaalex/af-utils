import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, relative } from "node:path";

const pnpmArgs = ["list", "--recursive", "--depth", "-1", "--json"];
const workspaceJson = execFileSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    pnpmArgs,
    { encoding: "utf8" }
);
const workspacePackages = JSON.parse(workspaceJson);
const failures = [];
for (const workspacePackage of workspacePackages) {
    const readmePath = join(workspacePackage.path, "README.md");
    const displayPath = relative(process.cwd(), readmePath);
    if (!existsSync(readmePath)) {
        failures.push(`${displayPath}: missing README`);
        continue;
    }

    const content = readFileSync(readmePath, "utf8");
    const firstLine = content.split("\n").find(line => line.trim()) ?? "";
    if (!firstLine.startsWith("# ")) {
        failures.push(`${displayPath}: first content line must be an H1`);
    }
    if (content.replace(/^# .*$/mu, "").trim().length < 120) {
        failures.push(`${displayPath}: add a concrete package purpose`);
    }
    if (!/\[[^\]]+\]\([^)]+\)/u.test(content)) {
        failures.push(
            `${displayPath}: link usage or development documentation`
        );
    }
    if (!/```|`(?:import|node|npm|npx|pnpm)\b/u.test(content)) {
        failures.push(
            `${displayPath}: include an executable usage or development instruction`
        );
    }
    if (
        workspacePackage.path !== process.cwd() &&
        !content.includes(workspacePackage.name)
    ) {
        failures.push(`${displayPath}: mention ${workspacePackage.name}`);
    }
}

if (failures.length > 0) {
    throw new Error(`README contract failures:\n${failures.join("\n")}`);
}

console.log(
    `Every workspace package has a README.md (${workspacePackages.length} checked).`
);
