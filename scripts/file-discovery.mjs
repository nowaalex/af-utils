import { glob } from "tinyglobby";

const ignoredDirectories = [
    "**/.git/**",
    "**/.stryker-tmp/**",
    "**/.vite/**",
    "**/coverage/**",
    "**/dist/**",
    "**/node_modules/**"
];

export const findFiles = async (directory, patterns = "**/*") =>
    (
        await glob(patterns, {
            absolute: true,
            cwd: directory,
            ignore: ignoredDirectories,
            onlyFiles: true
        })
    ).toSorted();

export const findPackageManifests = (directory, roots) =>
    findFiles(
        directory,
        roots.map(root => `${root}/**/package.json`)
    );
