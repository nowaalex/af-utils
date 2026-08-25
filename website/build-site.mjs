import { execFileSync } from "node:child_process";
import { resolvePackageBin } from "./package-bin.mjs";

const runNodeBin = (packageName, binName, arguments_) => {
    execFileSync(
        process.execPath,
        [resolvePackageBin(packageName, binName), ...arguments_],
        { stdio: "inherit" }
    );
};

runNodeBin("astro", "astro", ["build"]);
runNodeBin("pagefind", "pagefind", [
    "--site",
    "dist",
    "--glob",
    "{index.html,virtual/**/*.html,scrollend-polyfill/**/*.html}",
    "--quiet"
]);
