import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { build, context } from "esbuild";

const packageRoot = resolve(import.meta.dirname, "..");
const legacyOutputFiles = ["dist/index.js", "dist/index.node.js"];
const buildOutputFiles = [
    "dist/index.production.js",
    "dist/index.development.js",
    "dist/index.node.production.js",
    "dist/index.node.development.js"
];
const outputFiles = [
    ...legacyOutputFiles,
    ...buildOutputFiles,
    ...buildOutputFiles.map(path => `${path}.map`)
];

const commonOptions = {
    absWorkingDir: packageRoot,
    bundle: true,
    entryPoints: ["src/index.ts", "src/index.node.ts"],
    format: "esm",
    legalComments: "none",
    logLevel: "info",
    outdir: "dist",
    platform: "neutral",
    sourcemap: "linked"
};

const developmentOptions = {
    ...commonOptions,
    conditions: ["development"],
    entryNames: "[name].development"
};

const productionOptions = {
    ...commonOptions,
    entryNames: "[name].production",
    mangleProps: /^_/,
    minify: true
};

const cleanOutputFiles = () =>
    Promise.all(
        outputFiles.map(path => rm(resolve(packageRoot, path), { force: true }))
    );

await cleanOutputFiles();

if (process.argv.includes("--watch")) {
    const buildContext = await context(developmentOptions);
    await buildContext.watch();
} else {
    await build(productionOptions);
    await build(developmentOptions);
}
