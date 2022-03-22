import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import exportBundleSize from "@rollup/plugin-export-bundle-size";
import { terser } from "rollup-plugin-terser";

const OUTPUT_DIR = "lib";

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
        commonjs(),
        exportBundleSize({ dir: OUTPUT_DIR })
    ],
    external: [
        "react",
        "react-dnd",
        "mobx",
        "mobx-react-lite",
        "@babel/runtime",
        "@af-utils/styled",
        "@af-utils/react-table",
        "@af-utils/react-virtual-headless",
        "prop-types"
    ]
}