import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import exportBundleSize from "@rollup/plugin-export-bundle-size";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";

const OUTPUT_DIR = "lib";

const BASE_OUTPUT = {
    format: "es",
    dir: OUTPUT_DIR,
    generatedCode: "es2015",
    sourcemap: true
};

const BASE_PLUGINS = [
    terser({
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
    commonjs()
];

export default [
    {
        input: "src/index.js",
        output: {
            ...BASE_OUTPUT,
            entryFileNames: "[name].js"
        },
        plugins: [
            ...BASE_PLUGINS,
            exportBundleSize({ dir: OUTPUT_DIR }),
            replace({
                "preventAssignment": true,
                "process.env.__IS_SERVER__": false
            })
        ]
    },
    {
        input: "src/index.js",
        output: {
            ...BASE_OUTPUT,
            entryFileNames: "[name].server.js"
        },
        plugins: [
            ...BASE_PLUGINS,
            replace({
                "preventAssignment": true,
                "process.env.__IS_SERVER__": true
            })
        ]
    }
];
