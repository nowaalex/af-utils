import { basename, dirname, extname, relative, resolve, sep } from "node:path";

import type { HotRuntimeName } from "../../types.js";
import type { ParsedFile } from "../internal-model.js";
import { isInside, packageExportsSelectFile } from "../resolution.js";
import type { PackageInfo } from "../resolution.js";

const pathWithoutExtension = (file: string) => {
    const extension = extname(file);
    return extension ? file.slice(0, -extension.length) : file;
};

/** Refuse an ignored generated file that could change the analyzed graph. */
export const assertIgnoredFilesCannotChangeResolution = (
    entry: string,
    packageInfo: PackageInfo,
    parsedFiles: readonly ParsedFile[],
    ignoredFiles: readonly string[],
    runtime: HotRuntimeName
) => {
    const ignoredInsidePackage = ignoredFiles
        .map(file => resolve(file))
        .filter(file => isInside(packageInfo.root, file));
    for (const ignored of ignoredInsidePackage) {
        const packageRelative = `./${relative(packageInfo.root, ignored)
            .split(sep)
            .join("/")}`;
        if (
            packageExportsSelectFile(
                packageInfo.exports,
                packageRelative,
                runtime
            )
        ) {
            throw new Error(
                `Ignored generated file ${ignored} would create or replace a public package export; choose --out outside the target package`
            );
        }
        const ignoredStem = pathWithoutExtension(ignored);
        const collidingEdge = parsedFiles.find(parsed =>
            [...parsed.dependencies].some(([key, dependency]) => {
                const separator = key.indexOf("\0");
                const request = key.slice(separator + 1);
                if (ignored === dependency) return true;
                if (ignoredStem === pathWithoutExtension(dependency)) {
                    return true;
                }
                if (!request.startsWith(".")) return false;
                const requestedPath = resolve(dirname(parsed.file), request);
                return (
                    ignoredStem === pathWithoutExtension(requestedPath) ||
                    (dirname(ignored) === requestedPath &&
                        pathWithoutExtension(basename(ignored)) === "index")
                );
            })
        );
        if (
            ignored === entry ||
            ignoredStem === pathWithoutExtension(entry) ||
            collidingEdge
        ) {
            throw new Error(
                `Ignored generated file ${ignored} can change module resolution; choose --out outside the target package or a non-colliding filename`
            );
        }
    }
};
