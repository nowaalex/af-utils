import fs from "fs";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import postcss from "rollup-plugin-postcss";
import virtual from "@rollup/plugin-virtual";
import fileSize from "rollup-plugin-filesize";

import * as inlinedConstants from "./src/constants/events";

const removeInlinedConstantsImports = () => ({
    transform: code => code.replace( /import\s+{[^}]+}\s+from\s+["']constants\/events["'];/g, "" )
});

const OUTPUT_DIR = "lib";
const BUNDLE_TREESHAKE_STATS_OUTPUT_DIR = "treeshake_bundles";

fs.rmdirSync( OUTPUT_DIR, { recursive: true });
fs.rmdirSync( BUNDLE_TREESHAKE_STATS_OUTPUT_DIR, { recursive: true });

export default [
    {
        input: "src/index.esm.js",
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
                minimize: true,
                use: [ "sass" ],
                extensions: [ ".scss", ".css" ],
                modules: {
                    generateScopedName: "[hash:base64:7]",
                }
            }),
            babel({ babelHelpers: "runtime" }),
            commonjs()
        ],
        external: [ "react", "react-dom", "mobx", "mobx-react-lite" ]
    },
    ...[
        [ "list", `import { List } from "./lib/index.esm.js";List();` ],
        [ "table", `import { Table } from "./lib/index.esm.js";Table();` ],
        [ "listTable", `import { List, Table } from "./lib/index.esm.js";List();Table();` ]
    ].map(([ fileName, fileContent ]) => ({
        input: fileName,
        treeshake: {
            moduleSideEffects: "no-external"
        },
        plugins: [
            virtual({
                [fileName]: fileContent
            }),
            replace({
                "process.env.NODE_ENV": JSON.stringify( "production" )
            }),
            fileSize()
        ],
        output: {
            format: "es",
            file: `${BUNDLE_TREESHAKE_STATS_OUTPUT_DIR}/${fileName}.js`
        }
    }))
];