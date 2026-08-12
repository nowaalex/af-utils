import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import {
    type ExampleLocation,
    exampleEntryFile,
    examplesDirectory,
    getExampleLocation
} from "./config";

export interface DiscoveredExample extends ExampleLocation {
    astroClientOnly?: string;
    directory: string;
    entryFile: string;
}

const entryParts = exampleEntryFile.split("/");
const entrySuffix = entryParts.join(sep);

const getImplementationDirectory = (entryFile: string) =>
    entryParts.reduce(directory => dirname(directory), entryFile);

export const discoverExamples = async (
    directory = examplesDirectory
): Promise<DiscoveredExample[]> => {
    const entries = await readdir(directory, { withFileTypes: true });
    const discovered = await Promise.all(
        entries.map(async entry => {
            const entryPath = resolve(directory, entry.name);
            if (entry.isDirectory()) return discoverExamples(entryPath);
            if (!entryPath.endsWith(`${sep}${entrySuffix}`)) return [];

            const implementationDirectory =
                getImplementationDirectory(entryPath);
            const implementationPath = relative(
                examplesDirectory,
                implementationDirectory
            )
                .split(sep)
                .join("/");
            const packageJson = JSON.parse(
                await readFile(
                    resolve(implementationDirectory, "package.json"),
                    "utf8"
                )
            );

            return [
                {
                    ...getExampleLocation(implementationPath),
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
