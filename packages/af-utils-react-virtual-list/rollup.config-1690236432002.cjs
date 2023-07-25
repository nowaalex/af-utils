'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var babel = require('@rollup/plugin-babel');
var typescript = require('@rollup/plugin-typescript');
var commonjs = require('@rollup/plugin-commonjs');
var exportBundleSize = require('@rollup/plugin-export-bundle-size');
var terser = require('@rollup/plugin-terser');

const OUTPUT_DIR = "lib";

const BASE_PLUGINS = [
    typescript(),
    terser({
        mangle: {
            properties: {
                regex: /^_/
            }
        },
        module: true,
        compress: {
            ecma: 2022,
            unsafe: true,
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
    babel({
        babelHelpers: "runtime",
        extensions: [".js", ".jsx", ".ts", ".tsx"]
    }),
    commonjs(),
    exportBundleSize({ dir: OUTPUT_DIR })
];

var rollup_config = {
    input: "src/index.ts",
    plugins: BASE_PLUGINS,
    output: {
        format: "es",
        dir: OUTPUT_DIR,
        generatedCode: "es2015",
        sourcemap: true
    }
};

exports.default = rollup_config;
