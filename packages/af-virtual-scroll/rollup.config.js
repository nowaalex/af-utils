import fs from "fs";
import path from "path";
import babel from "@rollup/plugin-babel";
import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import postcss from "rollup-plugin-postcss";
import { terser } from "rollup-plugin-terser";
import resolve from "@rollup/plugin-node-resolve";

import * as inlinedConstants from "./src/constants/events";

const customResolver = resolve({
    extensions: [ '.js', '.scss' ]
});

const removeInlinedConstantsImports = () => ({
    transform: code => code.replace( /import\s+{[^}]+}\s+from\s+["']src\/constants\/events["'];/g, "" )
});

const OUTPUT_DIR = "lib";
fs.rmSync( OUTPUT_DIR, { recursive: true, force: true });

export default {
    input: {
        "index.esm": "src/index.esm.js",
    },
    output: {
        format: "es",
        dir: OUTPUT_DIR,
        preferConst: true,
    },
    plugins: [
        alias({
            entries: [{
                find: /^src\//,
                replacement: path.resolve(__dirname, 'src') + '/'
            }],
            customResolver
        }),
        removeInlinedConstantsImports(),
        replace({
            preventAssignment: true,
            exclude: /src\/constants\/events/,
            ...inlinedConstants
        }),
        postcss({
            extract: "style.css",
            use: [ "sass" ],
            extensions: [ ".scss", ".css" ],
            modules: {
                generateScopedName: "[hash:base64:7]",
            }
        }),
        terser({
            mangle: {
                properties: {
                    regex: /^_/
                }
            },
            module: true,
            output: {
                beautify: true,
                comments: "all",
                preserve_annotations: true
            }
        }),
        babel({ babelHelpers: "runtime" }),
        commonjs()
    ],
    external: [ "react" ]
}