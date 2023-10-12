import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import exportBundleSize from "@rollup/plugin-export-bundle-size";
import terser from "@rollup/plugin-terser";

const OUTPUT_DIR = "lib/";

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
    commonjs()
];
export default {
    input: "index.ts",
    plugins: [...BASE_PLUGINS, exportBundleSize({ dir: OUTPUT_DIR })],
    output: {
        format: "es",
        dir: OUTPUT_DIR,
        generatedCode: "es2015",
        sourcemap: true
    }
};
