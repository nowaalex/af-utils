import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import exportBundleSize from "@rollup/plugin-export-bundle-size";
import { terser } from "rollup-plugin-terser";

const OUTPUT_DIR = "lib";

export default {
    input: "src/index.js",
    output: {
        generatedCode: "es2015",
        format: "es",
        dir: OUTPUT_DIR,
        sourcemap: true
    },
    plugins: [
        terser({
            mangle: {
                properties: {
                    regex: /^_/
                }
            },
            module: true,
            compress: {
                passes: 2,
                ecma: 2022
            },
            output: {
                beautify: true,
                comments: "all",
                preserve_annotations: true
            }
        }),
        babel({ babelHelpers: "runtime" }),
        commonjs(),
        exportBundleSize({ dir: OUTPUT_DIR })
    ]
};
