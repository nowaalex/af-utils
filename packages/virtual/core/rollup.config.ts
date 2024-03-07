import exportBundleSize from "@af-utils/rollup-plugin-export-bundle-size";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import type { RollupOptions } from "rollup";

const OUTPUT_DIR = "lib/";

export default {
    input: "src/index.ts",
    plugins: [
        typescript({
            exclude: ["*rollup.config*"]
        }),
        terser({
            mangle: {
                properties: {
                    regex: /^_/
                }
            },
            module: true,
            compress: {
                ecma: 2020,
                unsafe: true,
                unsafe_comps: true,
                unsafe_math: true,
                passes: 2
            },
            format: {
                beautify: true,
                preserve_annotations: true
            },
            sourceMap: true
        })
    ],
    output: [
        {
            format: "es",
            file: `${OUTPUT_DIR}/index.js`,
            generatedCode: "es2015",
            sourcemap: true,
            plugins: [exportBundleSize({ dir: OUTPUT_DIR })]
        },
        {
            format: "es",
            file: `${OUTPUT_DIR}/index.polyfilled.js`,
            intro: `
            global.ResizeObserver ||= class ResizeObserver {
                observe() {}
                unobserve() {}
                disconnect() {}
            };
            `
        }
    ],
    external: [/@af-utils/]
} satisfies RollupOptions;
