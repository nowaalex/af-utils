import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { parse, join } from "node:path";
import { gzip as gzipCallback, brotliCompress } from "node:zlib";
import { promisify } from "node:util";
import { minify } from "terser";
import type { MinifyOptions } from "terser";

const tStart = performance.now();

const TERSER_OPTS = {
    module: true,
    compress: {
        global_defs: {
            "process.env.NODE_ENV": "production"
        }
    },
    output: {
        comments: false,
        preserve_annotations: false
    }
} as const satisfies MinifyOptions;

const EMPTY_FILE_SIZES = {
    raw: 0,
    min: 0,
    minGz: 0,
    minBrotli: 0
} as const;

const gzip = promisify(gzipCallback);
const brotli = promisify(brotliCompress);

async function write(
    fileName: string,
    fileSizes: Awaited<ReturnType<typeof getFileSizes>>
) {
    return Promise.all(
        [true, false].map(dts =>
            writeFile(
                dts ? fileName.replace(/.js$/, ".d.ts") : fileName,
                Object.entries(fileSizes)
                    .map(
                        ([name, size]) =>
                            `export ${dts ? "declare " : ""}const ${name} = ${size};`
                    )
                    .join("\n")
            )
        )
    );
}

async function getFileSizes(code: string) {
    if (code) {
        const { code: minifiedCode } = await minify(code, TERSER_OPTS);

        if (minifiedCode) {
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
    }
    return EMPTY_FILE_SIZES;
}

const fileNameToRealEntry = async (fileName: string) => {
    const fileContent = await readFile(fileName, { encoding: "utf-8" });
    const fileSizes = await getFileSizes(fileContent);
    return [fileName, fileSizes];
};

const fileNameToEmptyEntry = (fileName: string) => [fileName, EMPTY_FILE_SIZES];

const fileSizesEntries = await Promise.all(
    process.argv.slice(2).map(fileNameToRealEntry)
);

await writeFile(
    "lib/bundlesizes.js",
    `export default ${JSON.stringify(Object.fromEntries(fileSizesEntries), null, "\t")}`
);

console.log(
    `Bundle sizes created in ${Math.round((performance.now() - tStart) * 100) / 100}ms`
);
