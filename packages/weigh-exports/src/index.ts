#!/usr/bin/env node

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, normalize, parse } from "node:path";
import { parseArgs } from "node:util";
import chalk from "chalk";
import { glob } from "tinyglobby";
import getFileSizes from "./getFileSizes";
import exportsToGlobPatterns from "./parseExports";

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
    const inputPatterns = values.input.trim().split(/\s+/u);
    packagePaths = [
        ...new Set(
            (await glob(inputPatterns, { onlyDirectories: true })).map(path =>
                normalize(path)
            )
        )
    ].toSorted();
}

if (packagePaths.length === 0) {
    throw new Error("input must be provided");
}

if (values.output) {
    parsedOutput = await parse(values.output);
    outputTsFile = join(parsedOutput.dir, parsedOutput.name + ".ts");
}

const packageExports = (
    await Promise.all(
        packagePaths.map(async path => {
            const pkgJsonPath = join(path, "package.json");
            if (!existsSync(pkgJsonPath)) return null;

            const pkgJsonStr = await readFile(pkgJsonPath, {
                encoding: "utf-8"
            });
            const pkgJson = JSON.parse(pkgJsonStr);
            if (!pkgJson.exports) return null;
            if (!pkgJson.name) {
                throw new Error(
                    `'name' field is missing for package json file: ${pkgJsonPath}`
                );
            }

            const filteredExports = exportsToGlobPatterns(
                pkgJson.exports
            ).filter(pattern => /\.[cm]?js/u.test(pattern));
            const exports = (
                await Promise.all(
                    filteredExports.map(async (name: string) => {
                        const fileContent = await readFile(join(path, name), {
                            encoding: "utf-8"
                        });
                        const sizes = await getFileSizes(fileContent);
                        return [name, sizes] as const;
                    })
                )
            ).toSorted((a, b) => a[1].minBrotli - b[1].minBrotli);

            return [pkgJson.name, exports] as Package;
        })
    )
).filter((entry): entry is Package => entry !== null);

if (!values.quiet) {
    for (const entry of packageExports) {
        console.log(chalk.bold(entry[0]));
        console.table(
            entry[1].map(([file, sizes]) => ({
                file,
                raw: sizes.raw,
                min: sizes.min,
                minGz: sizes.minGz,
                minBrotli: sizes.minBrotli
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
