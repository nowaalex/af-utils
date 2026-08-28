import { build, context } from "esbuild";
import { browserBuildTarget } from "../../../scripts/browser-build-target.mjs";

const options = {
    entryPoints: ["index.ts"],
    format: "esm",
    legalComments: "none",
    outfile: "dist/index.js",
    platform: "browser",
    target: browserBuildTarget
};

if (process.argv.includes("--watch")) {
    const buildContext = await context(options);
    await buildContext.watch();
} else {
    await build(options);
}
