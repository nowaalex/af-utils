import typescript from "@rollup/plugin-typescript";
import exportBundleSize from "@rollup/plugin-export-bundle-size";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";

const OUTPUT_DIR = "lib/";

export default [true, false].map(isServer => ({
    input: "src/index.ts",
    plugins: [
        typescript({
            exclude: ["*rollup.config*"]
        }),
        replace({
            "preventAssignment": true,
            "process.env.__IS_SERVER__": isServer
        }),
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
        isServer ? null : exportBundleSize({ dir: OUTPUT_DIR })
    ],
    output: {
        format: "es",
        dir: OUTPUT_DIR,
        generatedCode: "es2015",
        sourcemap: !isServer,
        entryFileNames: `[name].${isServer ? "server." : ""}js`
    },
    external: [/@af-utils/]
}));
