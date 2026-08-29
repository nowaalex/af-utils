import { build, context } from "esbuild";
import { browserBuildTarget } from "../../../../scripts/browser-build-target.mjs";

const options = {
    bundle: true,
    entryPoints: ["src/index.ts"],
    external: ["@af-utils/*", "react", "react/jsx-runtime"],
    format: "esm",
    outdir: "dist",
    platform: "neutral",
    target: browserBuildTarget
};

if (process.argv.includes("--watch")) {
    const buildContext = await context(options);
    await buildContext.watch();
} else {
    await build(options);
}
