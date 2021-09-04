import fs from "fs";
import path from "path";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import resolve from "@rollup/plugin-node-resolve";
import postcss from "rollup-plugin-postcss";

const OUTPUT_DIR = "lib";

fs.rmSync( OUTPUT_DIR, { recursive: true, force: true });

const customResolver = resolve({
    extensions: [ '.js', '.scss' ]
});

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
        alias({
            entries: [{
                find: /^src\//,
                replacement: path.resolve(__dirname, 'src') + '/'
            }],
            customResolver
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
        commonjs()
    ],
    external: [ "react", "react-dnd", "mobx", "mobx-react-lite", "af-virtual-scroll" ]
}