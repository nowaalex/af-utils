import { readFile } from "node:fs/promises";
import { relative, sep } from "node:path";

import { parseSync } from "oxc-parser";

import type { HotExternalModuleBoundary, HotRuntimeName } from "../../types.js";
import { moduleDependencyKey } from "../internal-model.js";
import type { ParsedFile } from "../internal-model.js";
import {
    findPackageInfo,
    isInside,
    resolveSourceRequest
} from "../resolution.js";
import { collectModuleRequests } from "./requests.js";

const isInsideAnalysisPackage = (packageRoot: string, file: string) => {
    if (!isInside(packageRoot, file)) return false;
    return !relative(packageRoot, file).split(sep).includes("node_modules");
};

/** Inputs required for one package-scoped static graph traversal. */
export interface ParseHotModuleGraphOptions {
    entries: readonly string[];
    packageRoot: string;
    maxFiles: number;
    diagnostics: string[];
    runtime: HotRuntimeName;
}

/** Parse package-local runtime edges and record every external boundary. */
export const parseHotModuleGraph = async (
    options: ParseHotModuleGraphOptions
) => {
    const parsedFiles: ParsedFile[] = [];
    const terminalFiles = new Set<string>();
    const externalBoundaries: HotExternalModuleBoundary[] = [];
    const pending = [...options.entries];
    const visited = new Set<string>();

    while (pending.length > 0 && parsedFiles.length < options.maxFiles) {
        const file = pending.shift();
        if (!file || visited.has(file)) continue;
        visited.add(file);
        // oxlint-disable-next-line no-await-in-loop -- Breadth-first parsing discovers the next local dependency batch.
        const source = await readFile(file, "utf8");
        const parsed = parseSync(file, source, {
            sourceType: "unambiguous",
            astType: "ts"
        });
        for (const error of parsed.errors) {
            options.diagnostics.push(`${file}: ${error.message}`);
        }
        const requests = collectModuleRequests(
            parsed.program,
            parsed.module,
            file,
            options.diagnostics
        );
        // oxlint-disable-next-line no-await-in-loop -- Each breadth-first step resolves the imports it just discovered.
        const resolutions = await Promise.all(
            requests.map(({ request, mode }) =>
                resolveSourceRequest(file, request, options.runtime, mode)
            )
        );
        const dependencies = new Map<string, string>();
        for (const [index, { request, mode }] of requests.entries()) {
            const resolution = resolutions[index];
            if (resolution.path) {
                dependencies.set(
                    moduleDependencyKey(request, mode),
                    resolution.path
                );
                if (
                    isInsideAnalysisPackage(
                        options.packageRoot,
                        resolution.path
                    )
                ) {
                    pending.push(resolution.path);
                } else {
                    // oxlint-disable-next-line no-await-in-loop -- External boundaries require the nearest selected package identity.
                    const externalPackage = await findPackageInfo(
                        resolution.path
                    );
                    externalBoundaries.push({
                        importer: relative(options.packageRoot, file)
                            .split(sep)
                            .join("/"),
                        request,
                        mode,
                        packageName: externalPackage.name,
                        packageVersion: externalPackage.version,
                        packageRelativeFile: relative(
                            externalPackage.root,
                            resolution.path
                        )
                            .split(sep)
                            .join("/")
                    });
                }
            } else if (
                resolution.resolvedPath &&
                isInsideAnalysisPackage(
                    options.packageRoot,
                    resolution.resolvedPath
                )
            ) {
                terminalFiles.add(resolution.resolvedPath);
            } else if (resolution.resolvedPath) {
                // oxlint-disable-next-line no-await-in-loop -- Terminal external assets also define a runtime graph boundary.
                const externalPackage = await findPackageInfo(
                    resolution.resolvedPath
                );
                externalBoundaries.push({
                    importer: relative(options.packageRoot, file)
                        .split(sep)
                        .join("/"),
                    request,
                    mode,
                    packageName: externalPackage.name,
                    packageVersion: externalPackage.version,
                    packageRelativeFile: relative(
                        externalPackage.root,
                        resolution.resolvedPath
                    )
                        .split(sep)
                        .join("/")
                });
            } else if (!resolution.builtin && !resolution.resolvedPath) {
                options.diagnostics.push(
                    `${file}: unresolved module edge ${JSON.stringify(request)} (${resolution.error ?? "no supported JS/TS source"})`
                );
            }
        }
        parsedFiles.push({
            file,
            source,
            program: parsed.program,
            module: parsed.module,
            comments: parsed.comments,
            dependencies
        });
    }
    if (pending.length > 0) {
        options.diagnostics.push(
            `Module graph stopped at maxFiles=${options.maxFiles}; ${pending.length} file(s) remained queued`
        );
    }
    return {
        parsedFiles,
        terminalFiles: [...terminalFiles],
        externalBoundaries: [
            ...new Map(
                externalBoundaries.map(boundary => [
                    `${boundary.importer}\0${boundary.mode}\0${boundary.request}\0${boundary.packageName ?? ""}\0${boundary.packageRelativeFile}`,
                    boundary
                ])
            ).values()
        ].toSorted((left, right) => {
            const leftKey = `${left.importer}\0${left.mode}\0${left.request}`;
            const rightKey = `${right.importer}\0${right.mode}\0${right.request}`;
            return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
        })
    };
};
