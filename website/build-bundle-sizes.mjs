import { execFileSync } from "node:child_process";
import { resolvePackageBin } from "./package-bin.mjs";

const runNodeBin = (packageName, binName, arguments_) => {
    execFileSync(
        process.execPath,
        [resolvePackageBin(packageName, binName), ...arguments_],
        { stdio: "inherit" }
    );
};

runNodeBin("@af-utils/weigh-exports", "weigh-exports", [
    "-i",
    "../packages/virtual/* ../packages/scrollend-polyfill",
    "-o",
    "./.generated/bundleSizes.ts"
]);
runNodeBin("oxfmt", "oxfmt", ["./.generated/bundleSizes.ts"]);
