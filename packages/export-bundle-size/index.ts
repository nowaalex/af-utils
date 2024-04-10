import { writeFile, readFile } from "node:fs/promises";
import { parse, join } from "node:path";
import { gzip as gzipCallback, brotliCompress } from "node:zlib";
import { promisify } from "node:util";
import { MinifyOptions, minify } from "terser";

const tStart = performance.now();

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

for (let i = 2; i < process.argv.length; i++) {
    const filePath = process.argv[i];
    const parsedPath = parse(filePath);
    const newFileName = join(
        parsedPath.dir + `/bundlesize.${parsedPath.name}.js`
    );
    const fileContent = await readFile(filePath, { encoding: "utf-8" });
    const fileSizes = await getFileSizes(fileContent);
    await Promise.all([
        write(newFileName, fileSizes, false),
        write(newFileName, fileSizes, true)
    ]);
}

console.log(
    `Bundle sizes created in ${Math.round((performance.now() - tStart) * 100) / 100}ms`
);
