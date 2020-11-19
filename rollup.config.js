import fs from "fs";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import postcss from "rollup-plugin-postcss";
import { terser } from "rollup-plugin-terser";

import * as inlinedConstants from "./src/constants/events";

const removeInlinedConstantsImports = () => ({
    transform: code => code.replace( /import\s+{[^}]+}\s+from\s+["']constants\/events["'];/g, "" )
});

const OUTPUT_DIR = "lib";

fs.rmdirSync( OUTPUT_DIR, { recursive: true });

export default {
    input: {
        List: "src/components/List/index.js",
        Table: "src/components/Table/index.js",
        ComplexTable: "src/components/ComplexTable/index.js",
        tableRenderers: "src/components/Table/renderers.js",
        useApi: "src/hooks/useApi/index.js",
    },
    output: {
        format: "es",
        dir: OUTPUT_DIR,
        chunkFileNames: "_/[hash].js",
        hoistTransitiveImports: false
    },
    plugins: [
        removeInlinedConstantsImports(),
        replace({
            exclude: /constants\/events/,
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
        babel({ babelHelpers: "runtime" }),
        commonjs(),
        terser({
            format: {
                beautify: true
            },
            module: true,
            compress: {
                passes: 3
            }
        })
    ],
    external: [ "react", "react-dom", "mobx", "mobx-react-lite" ]
};