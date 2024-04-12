import { writeFile, readFile, mkdir } from "node:fs/promises";
import { parseArgs, promisify } from "node:util";
import { existsSync } from "node:fs";
import { parse, join, extname } from "node:path";
import { gzip as gzipCallback, brotliCompress } from "node:zlib";
import fastGlob from "fast-glob";
import { minify } from "@swc/core";
import type { JsMinifyOptions } from "@swc/core";

const tStart = performance.now();

const { values } = parseArgs({
    options: {
        input: {
            type: "string",
            short: "i"
        },
        output: {
            type: "string",
            short: "o"
        },
        quiet: {
            type: "boolean",
            short: "q"
        }
    }
});

if (!values.input) {
    throw Error("input must be provided");
}

let parsedOutput: ReturnType<typeof parse> | null = null,
    outputJsFile = "",
    outputDtsFile = "";

if (values.output) {
    parsedOutput = await parse(values.output);
    outputJsFile = join(parsedOutput.dir, parsedOutput.name + ".js");
    outputDtsFile = join(parsedOutput.dir, parsedOutput.name + ".d.ts");
}

const globPaths = values.input.trim().split(/\s+/);

const allInputFiles = await fastGlob(
    parsedOutput ? [...globPaths, `!${outputJsFile}`] : globPaths
);

const jsInputFiles = allInputFiles.filter(
    fileName => extname(fileName) === ".js"
);

const SWC_OPTS = {
    module: true,
    compress: {
        global_defs: {
            "process.env.NODE_ENV": "production"
        }
    },
    format: {
        comments: false,
        preserve_annotations: false
    }
} as const satisfies JsMinifyOptions;

const gzip = promisify(gzipCallback);
const brotli = promisify(brotliCompress);

async function getFileSizes(code: string) {
    const { code: minifiedCode } = await minify(code, SWC_OPTS);

    const [minifiedGzip, minifiedBrotli] = await Promise.all([
        gzip(minifiedCode),
        brotli(minifiedCode)
    ]);

    return {
        raw: code.length,
        min: minifiedCode.length,
        minGz: minifiedGzip.length,
        minBrotli: minifiedBrotli.length
    } as const;
}

const fileNameToRealEntry = async (fileName: string) => {
    const fileContent = await readFile(fileName, { encoding: "utf-8" });
    const fileSizes = await getFileSizes(fileContent);
    return [fileName, fileSizes] as const;
};

if (jsInputFiles.length) {
    const fileSizesEntries = await Promise.all(
        jsInputFiles.map(fileNameToRealEntry)
    );

    if (!values.quiet) {
        console.table(
            fileSizesEntries.map(([file, sizes]) => ({
                file,
                ...sizes
            }))
        );
    }

    if (parsedOutput) {
        if (!existsSync(parsedOutput.dir)) {
            await mkdir(parsedOutput.dir, { recursive: true });
        }

        const jsonStr = JSON.stringify(
            Object.fromEntries(fileSizesEntries),
            null,
            "\t"
        );

        await Promise.all([
            writeFile(outputJsFile, `export default ${jsonStr};`),
            writeFile(
                outputDtsFile,
                `declare const _default: ${jsonStr};\nexport default _default;`
            )
        ]);
    }

    console.log(
        `Bundle sizes created in ${Math.round((performance.now() - tStart) * 100) / 100}ms`
    );
} else {
    console.log(
        `Input files were not found. Provided glob paths: [${globPaths.join(", ")}]`
    );
}
