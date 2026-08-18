import { execFileSync } from "node:child_process";

const generatedPaths = [
    "website/src/bundleSizes.ts",
    "website/src/content/reference"
];
const status = execFileSync(
    "git",
    [
        "status",
        "--porcelain=v1",
        "--untracked-files=all",
        "--",
        ...generatedPaths
    ],
    { encoding: "utf8" }
).trim();

if (status) {
    console.error("Generated website files differ from the tracked versions:");
    console.error(status);
    process.exitCode = 1;
}
