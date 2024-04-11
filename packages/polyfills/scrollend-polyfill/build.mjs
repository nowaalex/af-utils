import { context, build } from "esbuild";

/** @type {import('esbuild').BuildOptions} */
const COMMON_OPTIONS = {
    entryPoints: ["./index.ts"],
    format: "esm",
    outdir: "lib",
    bundle: true
};

if (process.argv.length === 3 && process.argv[2] === "prod") {
    /** @type {import('esbuild').BuildOptions} */
    build({
        ...COMMON_OPTIONS,
        mangleProps: /^_/,
        define: {
            "process.env.NODE_ENV": JSON.stringify("production")
        }
    });
} else {
    const ctx = await context(COMMON_OPTIONS);
    await ctx.watch();
}
