import { resolve } from "node:path";
import { build } from "esbuild";

const packageRoot = resolve(import.meta.dirname, "../..");

await build({
    absWorkingDir: packageRoot,
    bundle: true,
    entryPoints: {
        PrivateFieldFixture: "src/benchmarks/privateFieldFixture.ts",
        SizeIndex: "src/models/SizeIndex/index.ts",
        VirtualScroller: "src/models/VirtualScroller/index.ts",
        VirtualScrollerLayout: "src/models/VirtualScrollerLayout/index.ts"
    },
    format: "esm",
    logLevel: "info",
    outdir: ".jit",
    outExtension: { ".js": ".mjs" },
    platform: "node"
});
