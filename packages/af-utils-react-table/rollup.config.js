import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import exportBundleSize from "@rollup/plugin-export-bundle-size";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

const OUTPUT_DIR = "lib";

export default {
    input: "src/index.ts",
    output: {
        format: "es",
        dir: OUTPUT_DIR,
        generatedCode: "es2015",
        sourcemap: true
    },
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
