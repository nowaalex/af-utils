import { writeFile } from "fs/promises";
import { gzip as gzipCallback, brotliCompress } from "zlib";
import { promisify } from "util";
import { MinifyOptions, minify } from "terser";
import type { Plugin } from "rollup";

const TERSER_OPTS = {
    compress: {
        global_defs: {
            "process.env.NODE_ENV": "production"
        }
    },
    output: {
        comments: false,
        preserve_annotations: false
    }
} satisfies MinifyOptions;

const gzip = promisify(gzipCallback);
const brotli = promisify(brotliCompress);

async function write(
    fileName: string,
    fileSizes: Awaited<ReturnType<typeof getFileSizes>>,
    dts: boolean
) {
    const str = Object.entries(fileSizes)
        .map(
            ([name, size]) =>
                `export ${dts ? "declare " : ""}const ${name} = ${size};`
        )
        .join("\n");

    await writeFile(dts ? fileName.replace(/.js$/, ".d.ts") : fileName, str);
}

async function getFileSizes(code: string) {
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

    return {
        raw: 0,
        min: 0,
        minGz: 0,
        minBrotli: 0
    } as const;
}

function createPlugin({ dir, whitelist }: { dir: string; whitelist?: RegExp }) {
    return {
        name: "export-bundle-size",
        writeBundle: async (_, output) => {
            for (const file in output) {
                if (!whitelist || whitelist.test(file)) {
                    const newFileName = `${dir}/bundlesize.${file}`;
                    const outputContent = output[file];

                    if ("code" in outputContent) {
                        const fileSizes = await getFileSizes(
                            outputContent.code
                        );
                        await Promise.all([
                            write(newFileName, fileSizes, false),
                            write(newFileName, fileSizes, true)
                        ]);
                    }
                }
            }
        }
    } as const satisfies Plugin;
}

export default createPlugin;
