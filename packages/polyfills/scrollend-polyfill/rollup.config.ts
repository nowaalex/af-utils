import typescript from "@rollup/plugin-typescript";
import exportBundleSize from "@af-utils/rollup-plugin-export-bundle-size";
import terser from "@rollup/plugin-terser";

const OUTPUT_DIR = "lib/";

export default {
    input: "index.ts",
    plugins: [
        typescript(),
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
            output: {
                beautify: true,
                preserve_annotations: true
            }
        }),
        exportBundleSize({ dir: OUTPUT_DIR })
    ],
    output: {
        format: "es",
        dir: OUTPUT_DIR,
        generatedCode: "es2015",
        sourcemap: true
    }
};
