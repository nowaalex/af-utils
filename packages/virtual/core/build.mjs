import { writeFile, readFile } from "node:fs/promises";
import { context, build } from "esbuild";

/** @type {import('esbuild').BuildOptions} */
const COMMON_OPTIONS = {
    entryPoints: ["./src/index.ts"],
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
    const content = await readFile("./lib/index.js", { encoding: "utf-8" });
    await writeFile(
        "./lib/index.polyfilled.js",
        "global.ResizeObserver ||= class {\nobserve(){}\nunobserve(){}\ndisconnect(){}\n}\n" +
            content
    );
} else {
    const ctx = await context(COMMON_OPTIONS);
    await ctx.watch();
}
