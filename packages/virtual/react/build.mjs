import { context, build } from "esbuild";

/** @type {import('esbuild').BuildOptions} */
const COMMON_OPTIONS = {
    entryPoints: ["./src/index.ts"],
    format: "esm",
    outdir: "lib",
    bundle: true,
    external: [
        "@af-utils/*",
        "react/jsx-runtime",
        "react",
        "use-sync-external-store/shim/index.js"
    ]
};

if (process.argv.length === 3 && process.argv[2] === "prod") {
    /** @type {import('esbuild').BuildOptions} */
    build({
        ...COMMON_OPTIONS,
        define: {
            "process.env.NODE_ENV": JSON.stringify("production")
        }
    });
} else {
    const ctx = await context(COMMON_OPTIONS);
    await ctx.watch();
}
