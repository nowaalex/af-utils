import fs from "fs";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import postcss from "rollup-plugin-postcss";

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
        sourcemap: true
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
        commonjs()
    ],
    external: [ "react", "react-dnd", "mobx", "mobx-react-lite", "af-virtual-scroll" ]
}