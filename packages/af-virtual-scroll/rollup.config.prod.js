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
        [ "hook", `import { useVirtual } from "./lib/index.js";useVirtual();` ],
        [ "list", `import { VerticalList, useVirtual } from "./lib/index.js";VerticalList();useVirtual();` ],
        [ "table", `import { Table, useVirtual } from "./lib/index.js";Table();useVirtual();` ],
        [ "listTable", `import { VerticalList, Table, useVirtual } from "./lib/index.js";VerticalList();Table();useVirtual();` ]
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