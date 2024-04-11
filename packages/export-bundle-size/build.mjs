import { context, build } from "esbuild";

/** @type {import('esbuild').BuildOptions} */
const COMMON_OPTIONS = {
    entryPoints: ["./src/index.ts"],
    format: "esm",
    outdir: "lib",
    platform: "node",
    bundle: true
};

if (process.argv.length === 3 && process.argv[2] === "prod") {
    /** @type {import('esbuild').BuildOptions} */
    await build({
        ...COMMON_OPTIONS,
        mangleProps: /^_/
    });
} else {
    const ctx = await context(COMMON_OPTIONS);
    await ctx.watch();
}
