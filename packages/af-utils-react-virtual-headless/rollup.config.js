import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import exportBundleSize from "@rollup/plugin-export-bundle-size";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";

const OUTPUT_DIR = "lib";

const BASE_PLUGINS = [
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
    babel({ babelHelpers: "runtime" }),
    commonjs()
];

export default [true, false].map(isServer => ({
    input: "src/index.js",
    plugins: [
        ...BASE_PLUGINS,
        exportBundleSize({ dir: OUTPUT_DIR }),
        replace({
            "preventAssignment": true,
            "process.env.__IS_SERVER__": isServer
        })
    ],
    output: {
        format: "es",
        dir: OUTPUT_DIR,
        generatedCode: "es2015",
        sourcemap: true,
        entryFileNames: `[name].${isServer ? "server." : ""}js`
    }
}));
