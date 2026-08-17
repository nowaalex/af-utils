import { build } from "esbuild";

const entries = [
    "auto",
    "date-fns",
    "generic",
    "index",
    "lodash",
    "react",
    "shared",
    "svelte",
    "three"
];

const result = await build({
    entryPoints: entries.map(name => `src/${name}.ts`),
    outbase: "src",
    outdir: "dist",
    entryNames: "[name]",
    chunkNames: "chunks/[name]-[hash]",
    bundle: true,
    splitting: true,
    format: "esm",
    platform: "neutral",
    target: "es2022",
    metafile: true,
    logLevel: "warning"
});

const externalImports = Object.entries(result.metafile.outputs).flatMap(
    ([output, metadata]) =>
        metadata.imports
            .filter(item => item.external)
            .map(item => `${output} -> ${item.path}`)
);
if (externalImports.length > 0) {
    throw new Error(
        `Published test runners must be self-contained; external imports remain:\n${externalImports.join("\n")}`
    );
}
