import fs from "fs";
import replace from "@rollup/plugin-replace";
import virtual from "@rollup/plugin-virtual";
import fileSize from "rollup-plugin-filesize";
import { terser } from "rollup-plugin-terser";
import commonConfig from "./rollup.config.js";

const BUNDLE_TREESHAKE_STATS_OUTPUT_DIR = "treeshake_bundles";
fs.rmSync( BUNDLE_TREESHAKE_STATS_OUTPUT_DIR, { recursive: true, force: true });

export default [
    commonConfig,
    ...[
        [ "hook", `import { useVirtual } from "./lib/index.esm.js";useVirtual();` ],
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
                preventAssignment: true,
                "process.env.NODE_ENV": JSON.stringify( "production" )
            }),
            terser({
                output: {
                    beautify: false
                }
            }),
            fileSize()
        ],
        output: {
            format: "es",
            file: `${BUNDLE_TREESHAKE_STATS_OUTPUT_DIR}/${fileName}.js`,
            preferConst: true
        }
    }))
];