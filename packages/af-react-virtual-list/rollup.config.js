import fs from "fs";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";

const OUTPUT_DIR = "lib";
fs.rmSync( OUTPUT_DIR, { recursive: true, force: true });

export default {
    input: "src/index.js",
    output: {
        format: "es",
        dir: OUTPUT_DIR,
        preferConst: true,
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
            },
            output: {
                beautify: true,
                comments: "all",
                preserve_annotations: true
            }
        }),
        babel({ babelHelpers: "runtime" }),
        commonjs()
    ],
    external: [
        "react",
        "@af/styled",
        "@af/react-virtual-headless",
        "@babel/runtime",
        "prop-types"
    ]
}