import fs from "fs";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import postcss from "rollup-plugin-postcss";
import { terser } from "rollup-plugin-terser";

const OUTPUT_DIR = "lib";

fs.rmdirSync( OUTPUT_DIR, { recursive: true });

export default {
    input: {
        /*
        Table: "src/Table/index.js",
        TableRow: "src/Table/Row/index.js",
        TableCell: "src/Table/Cell/index.js",
        TableTotalsCell: "src/Table/TotalsCell/index.js",
*/
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
    external: [ "react", "react-dom", "lodash", "mobx", "mobx-react-lite" ]
};