import babel from "@rollup/plugin-babel";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import exportBundleSize from "@rollup/plugin-export-bundle-size";
import terser from "@rollup/plugin-terser";

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

export default {
    input: "src/index.ts",
    plugins: BASE_PLUGINS,
    output: {
        format: "es",
        dir: OUTPUT_DIR,
        generatedCode: "es2015",
        sourcemap: true
    }
};
