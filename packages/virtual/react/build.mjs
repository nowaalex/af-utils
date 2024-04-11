import { context, build } from "esbuild";

/** @type {import('esbuild').BuildOptions} */
const COMMON_OPTIONS = {
    entryPoints: ["./src/index.ts"],
    format: "esm",
    outdir: "lib",
    bundle: true,
    // choosing 'neutral' because process.env.NODE_ENV must not be substituted
    platform: "neutral",
    external: [
        "@af-utils/*",
        "react/jsx-runtime",
        "react",
        "use-sync-external-store/shim/index.js"
    ]
};

if (process.argv.length === 3 && process.argv[2] === "prod") {
    /** @type {import('esbuild').BuildOptions} */
    await build(COMMON_OPTIONS);
} else {
    const ctx = await context(COMMON_OPTIONS);
    await ctx.watch();
}
