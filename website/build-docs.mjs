import { execFileSync } from "node:child_process";
import { resolvePackageBin } from "./package-bin.mjs";

const runNodeBin = (packageName, binName, arguments_) => {
    execFileSync(
        process.execPath,
        [resolvePackageBin(packageName, binName), ...arguments_],
        { stdio: "inherit" }
    );
};

runNodeBin("typedoc", "typedoc", ["--options", "../typedoc.json"]);
runNodeBin("oxfmt", "oxfmt", ["./src/content/reference"]);
