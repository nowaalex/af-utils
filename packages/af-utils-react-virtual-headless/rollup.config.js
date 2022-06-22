import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import exportBundleSize from "@rollup/plugin-export-bundle-size";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";

const OUTPUT_DIR = "lib";

export default {
    input: "src/index.js",
    output: [
        {
            format: "es",
            dir: OUTPUT_DIR,
            preferConst: true,
            sourcemap: true,
            entryFileNames: "[name].js",
            plugins: [
                exportBundleSize({ dir: OUTPUT_DIR }),
                replace({
                    "process.env.__IS_SERVER__": false
                })
            ]
        },
        {
            format: "es",
            dir: OUTPUT_DIR,
            preferConst: true,
            sourcemap: false,
            entryFileNames: "[name].server.js",
            plugins: [
                replace({
                    "process.env.__IS_SERVER__": true
                })
            ]
        }
    ],
    plugins: [
        terser({
            mangle: {
                properties: {
                    regex: /^_/
                }
            },
            module: true,
            compress: {
                ecma: 2022,
                /*
                    No computed values are used, so saving some bytes
                    https://github.com/terser/terser
                */
                unsafe_comps: true,
                unsafe_math: true,
                passes: 2
            },
            output: {
                beautify: true,
                comments: "all",
                preserve_annotations: true
            }
        }),
        babel({ babelHelpers: "runtime" }),
        commonjs()
    ]
};
