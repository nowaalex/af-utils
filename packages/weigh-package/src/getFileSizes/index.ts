import { promisify } from "node:util";
import { gzip as gzipCallback, brotliCompress } from "node:zlib";
import { minify } from "@swc/core";

const MINIFIER_OPTIONS = {
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
} as const satisfies Parameters<typeof minify>[1];

const gzip = promisify(gzipCallback);
const brotli = promisify(brotliCompress);

async function getFileSizes(code: string) {
    const { code: minifiedCode } = await minify(code, MINIFIER_OPTIONS);
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

export default getFileSizes;
