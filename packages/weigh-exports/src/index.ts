import { writeFile, readFile, mkdir } from "node:fs/promises";
import { parseArgs } from "node:util";
import { existsSync } from "node:fs";
import { parse, join, normalize } from "node:path";
import fastGlob from "fast-glob";
import getFileSizes from "./getFileSizes";
import exportsToGlobPatterns from "./parseExports";
import chalk from "chalk";

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

type Export = readonly [string, Awaited<ReturnType<typeof getFileSizes>>];
type Package = [string, Export[]];

let parsedOutput: ReturnType<typeof parse> | null = null,
    outputTsFile = "",
    packagePaths: string[] = [];

if (values.input) {
    packagePaths = values.input.trim().split(/\s+/).map(normalize);
}

if (!packagePaths.length) {
    throw Error("input must be provided");
}

if (values.output) {
    parsedOutput = await parse(values.output);
    outputTsFile = join(parsedOutput.dir, parsedOutput.name + ".ts");
}

const packageExports: Package[] = [];

for (const path of packagePaths) {
    const pkgJsonPath = join(path, "package.json");
    if (existsSync(pkgJsonPath)) {
        const pkgJsonStr = await readFile(pkgJsonPath, { encoding: "utf-8" });
        const pkgJson = JSON.parse(pkgJsonStr);

        if (pkgJson.exports) {
            if (!pkgJson.name) {
                throw Error(
                    `'name' field is missing for package json file: ${pkgJsonPath}`
                );
            }
            const globPatterns = exportsToGlobPatterns(pkgJson.exports);
            const filteredExports = globPatterns.filter(f =>
                /\.[cm]?js/.test(f)
            );

            const exports = await Promise.all(
                filteredExports.map(async (name: string) => {
                    const fileContent = await readFile(join(path, name), {
                        encoding: "utf-8"
                    });
                    const sizes = await getFileSizes(fileContent);
                    return [name, sizes] as const;
                })
            );

            exports.sort((a, b) => a[1].minBrotli - b[1].minBrotli);

            packageExports.push([pkgJson.name, exports]);
        }
    }
}

if (!values.quiet) {
    for (const entry of packageExports) {
        console.log(chalk.bold(entry[0]));
        console.table(
            entry[1].map(([file, sizes]) => ({
                file,
                ...sizes
            }))
        );
    }
}

if (parsedOutput) {
    if (!existsSync(parsedOutput.dir)) {
        await mkdir(parsedOutput.dir, { recursive: true });
    }
    const jsonStr = JSON.stringify(
        Object.fromEntries(
            packageExports.map(([name, fileEntries]) => [
                name,
                Object.fromEntries(fileEntries)
            ])
        ),
        null,
        "\t"
    );
    await writeFile(
        outputTsFile,
        `// This file was generated automatically\n\nexport default ${jsonStr} as const;`
    );
}
console.log(
    `Bundle sizes created in ${Math.round((performance.now() - tStart) * 100) / 100}ms`
);
