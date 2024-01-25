import typescript from "@rollup/plugin-typescript";
import exportBundleSize from "@af-utils/rollup-plugin-export-bundle-size";
import terser from "@rollup/plugin-terser";
import { RollupOptions } from "rollup";

const OUTPUT_DIR = "lib/";

export default {
    input: "src/index.ts",
    plugins: [
        typescript({
            exclude: ["*rollup.config*"]
        }),
        terser({
            module: true,
            compress: {
                ecma: 2020,
                unsafe: true,
                unsafe_comps: true,
                unsafe_math: true,
                unsafe_arrows: true,
                passes: 2
            },
            output: {
                beautify: true,
                preserve_annotations: true,
                comments: /^[@#].+/
            },
            sourceMap: true
        }),
        exportBundleSize({ dir: OUTPUT_DIR })
    ],
    output: {
        format: "es",
        dir: OUTPUT_DIR,
        generatedCode: "es2015",
        sourcemap: true
    },
    external: [
        /@af-utils/,
        "react/jsx-runtime",
        "react",
        "use-sync-external-store/shim/index.js"
    ]
} satisfies RollupOptions;
