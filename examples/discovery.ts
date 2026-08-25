import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import {
    type ExampleLocation,
    exampleEntryFiles,
    examplesDirectory,
    getExampleLocation
} from "./config.ts";

export interface DiscoveredExample extends ExampleLocation {
    astroClientOnly?: string;
    directory: string;
    entryFile: string;
}

const entrySuffixes = Object.values(exampleEntryFiles).map(entryFile =>
    entryFile.split("/").join(sep)
);
const ignoredDirectories = new Set(["dist", "node_modules"]);

const getImplementationDirectory = (entryFile: string, entrySuffix: string) =>
    entrySuffix.split(sep).reduce(directory => dirname(directory), entryFile);

export const discoverExamples = async (
    directory = examplesDirectory
): Promise<DiscoveredExample[]> => {
    const entries = await readdir(directory, { withFileTypes: true });
    const discovered = await Promise.all(
        entries.map(async entry => {
            if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
                return [];
            }
            const entryPath = resolve(directory, entry.name);
            if (entry.isDirectory()) return discoverExamples(entryPath);
            const entrySuffix = entrySuffixes.find(suffix =>
                entryPath.endsWith(`${sep}${suffix}`)
            );
            if (!entrySuffix) return [];

            const implementationDirectory = getImplementationDirectory(
                entryPath,
                entrySuffix
            );
            const implementationPath = relative(
                examplesDirectory,
                implementationDirectory
            )
                .split(sep)
                .join("/");
            const location = getExampleLocation(implementationPath);
            if (
                entrySuffix !==
                exampleEntryFiles[location.framework].split("/").join(sep)
            ) {
                return [];
            }
            const packageJson = JSON.parse(
                await readFile(
                    resolve(implementationDirectory, "package.json"),
                    "utf8"
                ).catch(error => {
                    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                        return "{}";
                    }
                    throw error;
                })
            );

            return [
                {
                    ...location,
                    astroClientOnly: packageJson["af-utils"]?.astroClientOnly,
                    directory: implementationDirectory,
                    entryFile: entryPath
                }
            ];
        })
    );

    return discovered
        .flat()
        .toSorted((left, right) => left.route.localeCompare(right.route));
};
