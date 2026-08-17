import { access, readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { ResolverFactory } from "oxc-resolver";

import type { HotRuntimeName } from "../types.js";
import type { ModuleRequestMode } from "./internal-model.js";

export interface PackageInfo {
    root: string;
    name?: string;
    version?: string;
    exports?: unknown;
}

export interface AnalysisEntry {
    file: string;
    publicPath: string;
}

export const supportedExtensions = [
    ".js",
    ".mjs",
    ".cjs",
    ".jsx",
    ".ts",
    ".mts",
    ".cts",
    ".tsx"
];

const moduleResolvers = new Map<string, ResolverFactory>();
export const runtimeConditionNames = (
    runtime: HotRuntimeName,
    mode: ModuleRequestMode = "import"
) => {
    const requestCondition = mode === "require" ? "require" : "import";
    if (runtime === "bun") {
        return ["bun", "node-addons", "node", requestCondition, "default"];
    }
    if (runtime === "deno") {
        return mode === "require"
            ? ["require", "node", "module-sync", "default"]
            : ["deno", "node", "import", "module-sync", "default"];
    }
    return ["node-addons", "node", requestCondition, "module-sync", "default"];
};

const moduleResolverFor = (
    runtime: HotRuntimeName,
    mode: ModuleRequestMode,
    importer: string
) => {
    const bunLocalSource =
        runtime === "bun" && !importer.split(sep).includes("node_modules");
    const key = `${runtime}/${mode}/${bunLocalSource ? "local" : "package"}`;
    const existing = moduleResolvers.get(key);
    if (existing) return existing;
    const resolver = new ResolverFactory({
        builtinModules: true,
        // Deno and Bun intentionally participate in the Node compatibility
        // condition in addition to their own condition. Keep this aligned
        // with the active ESM condition sets of the selected runtime.
        conditionNames: runtimeConditionNames(runtime, mode),
        extensionAlias: bunLocalSource
            ? {
                  ".js": [".js", ".ts"],
                  ".jsx": [".jsx", ".tsx"],
                  ".mjs": [".mjs", ".mts"],
                  ".cjs": [".cjs"]
              }
            : {
                  // Runtime analysis follows the artifact a native loader executes.
                  // TypeScript substitution is only a fallback for source packages.
                  ".js": [".js", ".ts"],
                  ".jsx": [".jsx", ".tsx"],
                  ".mjs": runtime === "bun" ? [".mjs"] : [".mjs", ".mts"],
                  ".cjs": runtime === "bun" ? [".cjs"] : [".cjs", ".cts"]
              },
        extensions: bunLocalSource
            ? mode === "require"
                ? [
                      ".tsx",
                      ".jsx",
                      ".cts",
                      ".cjs",
                      ".ts",
                      ".js",
                      ".mts",
                      ".mjs",
                      ".json"
                  ]
                : [
                      ".tsx",
                      ".jsx",
                      ".mts",
                      ".ts",
                      ".mjs",
                      ".js",
                      ".cts",
                      ".cjs",
                      ".json"
                  ]
            : runtime === "bun"
              ? [
                    ".js",
                    ".jsx",
                    ".mjs",
                    ".cjs",
                    ".json",
                    ".tsx",
                    ".mts",
                    ".ts",
                    ".cts"
                ]
              : supportedExtensions,
        // Node and Deno follow the legacy `main` field when `exports` is
        // absent. Bun's runtime also prefers `main` when present and only
        // falls back to the compatibility `module` field otherwise.
        mainFields: runtime === "bun" ? ["main", "module"] : ["main"],
        tsconfig: "auto"
    });
    moduleResolvers.set(key, resolver);
    return resolver;
};

export const pathExists = async (path: string) => {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
};

export const resolveSourceRequest = async (
    importer: string,
    request: string,
    runtime: HotRuntimeName = "node",
    mode: ModuleRequestMode = "import"
) => {
    const result = await moduleResolverFor(
        runtime,
        mode,
        importer
    ).resolveFileAsync(importer, request);
    const resolvedPath = result.path;
    return !resolvedPath || !supportedExtensions.includes(extname(resolvedPath))
        ? { ...result, path: undefined, resolvedPath }
        : { ...result, resolvedPath };
};

export const resolveSourceRequestSync = (
    importer: string,
    request: string,
    runtime: HotRuntimeName = "node",
    mode: ModuleRequestMode = "import"
) => {
    const result = moduleResolverFor(runtime, mode, importer).resolveFileSync(
        importer,
        request
    );
    const resolvedPath = result.path;
    return !resolvedPath || !supportedExtensions.includes(extname(resolvedPath))
        ? { ...result, path: undefined, resolvedPath }
        : { ...result, resolvedPath };
};

export const resolveInput = async (
    input: string,
    runtime: HotRuntimeName = "node"
) => {
    const local = input.startsWith("file:")
        ? fileURLToPath(new URL(input))
        : resolve(input);
    const localExists = await pathExists(local);
    let request = localExists ? local : input;
    let importer = resolve(process.cwd(), "check-hot.resolve.mjs");
    if (localExists && (await stat(local)).isDirectory()) {
        const manifestPath = join(local, "package.json");
        if (await pathExists(manifestPath)) {
            const manifest = JSON.parse(
                await readFile(manifestPath, "utf8")
            ) as {
                name?: unknown;
                exports?: unknown;
            };
            if (
                typeof manifest.name === "string" &&
                manifest.exports !== undefined
            ) {
                request = manifest.name;
                importer = join(local, "check-hot.resolve.mjs");
            }
        }
    }
    const resolved = await resolveSourceRequest(importer, request, runtime);
    if (!resolved.path) {
        throw new Error(
            `Unable to resolve ${input} from ${process.cwd()} through package exports/imports and TypeScript resolution: ${resolved.error ?? "no supported JS/TS source"}`
        );
    }
    return resolved.path;
};

export const findPackageInfo = async (entry: string): Promise<PackageInfo> => {
    let directory = dirname(entry);
    let nearestRoot: string | undefined;
    while (true) {
        const manifestPath = join(directory, "package.json");
        // oxlint-disable-next-line no-await-in-loop -- Package lookup must walk ancestors in nearest-first order.
        if (await pathExists(manifestPath)) {
            try {
                const manifest = JSON.parse(
                    // oxlint-disable-next-line no-await-in-loop -- Only the nearest discovered package manifest is read.
                    await readFile(manifestPath, "utf8")
                ) as {
                    name?: unknown;
                    version?: unknown;
                    exports?: unknown;
                };
                nearestRoot ??= directory;
                if (typeof manifest.name === "string") {
                    return {
                        root: directory,
                        name: manifest.name,
                        version:
                            typeof manifest.version === "string"
                                ? manifest.version
                                : undefined,
                        exports: manifest.exports
                    };
                }
            } catch {
                nearestRoot ??= directory;
            }
        }
        const parent = dirname(directory);
        if (parent === directory) {
            return { root: nearestRoot ?? dirname(entry) };
        }
        directory = parent;
    }
};

const isPackageRootInput = async (input: string, packageInfo: PackageInfo) => {
    if (!packageInfo.name) return false;
    if (input === packageInfo.name) return true;
    const local = input.startsWith("file:")
        ? fileURLToPath(new URL(input))
        : resolve(input);
    return (await pathExists(local)) && (await stat(local)).isDirectory();
};

interface SelectedExportTarget {
    matched: boolean;
    target?: string;
}

const selectExportTargetForRuntime = (
    value: unknown,
    runtime: HotRuntimeName
): SelectedExportTarget => {
    if (typeof value === "string") return { matched: true, target: value };
    if (value === null) return { matched: true };
    if (Array.isArray(value)) {
        for (const item of value) {
            const selection = selectExportTargetForRuntime(item, runtime);
            if (selection.matched) return selection;
        }
        return { matched: false };
    }
    if (typeof value !== "object") return { matched: true };
    const activeConditions = new Set(runtimeConditionNames(runtime));
    for (const [condition, targetValue] of Object.entries(value)) {
        if (!activeConditions.has(condition)) continue;
        const selection = selectExportTargetForRuntime(targetValue, runtime);
        if (selection.matched) return selection;
    }
    return { matched: false };
};

const exportTargetForRuntime = (value: unknown, runtime: HotRuntimeName) =>
    selectExportTargetForRuntime(value, runtime).target;

const filesBelow = async (root: string) => {
    const files: string[] = [];
    const pending = [root];
    while (pending.length > 0) {
        const directory = pending.shift();
        if (!directory) continue;
        // oxlint-disable-next-line no-await-in-loop -- Bounded package-directory traversal expands one public export pattern.
        const entries = await readdir(directory, { withFileTypes: true });
        for (const entry of entries) {
            const path = join(directory, entry.name);
            if (entry.isDirectory()) pending.push(path);
            else if (entry.isFile()) files.push(path);
        }
    }
    return files;
};

const expandPublicExportPattern = async (
    publicPath: string,
    targetValue: unknown,
    packageInfo: PackageInfo,
    runtime: HotRuntimeName
) => {
    const target = exportTargetForRuntime(targetValue, runtime);
    if (!target?.startsWith("./")) return [];
    const targetParts = target.split("*");
    if (targetParts.length !== 2) return [];
    const [targetPrefix, targetSuffix] = targetParts;
    const fixedRoot = resolve(packageInfo.root, dirname(targetPrefix));
    if (
        !isInside(packageInfo.root, fixedRoot) ||
        !(await pathExists(fixedRoot))
    ) {
        return [];
    }
    const concretePaths: string[] = [];
    for (const file of await filesBelow(fixedRoot)) {
        const relativeTarget = `./${relative(packageInfo.root, file).split(sep).join("/")}`;
        if (
            !relativeTarget.startsWith(targetPrefix) ||
            !relativeTarget.endsWith(targetSuffix)
        ) {
            continue;
        }
        const star = relativeTarget.slice(
            targetPrefix.length,
            relativeTarget.length - targetSuffix.length
        );
        concretePaths.push(publicPath.replaceAll("*", () => star));
    }
    return [...new Set(concretePaths)].toSorted();
};

const matchingExportKey = (
    publicPath: string,
    exportKeys: readonly string[]
) => {
    const matches = exportKeys.filter(key => {
        const wildcard = key.indexOf("*");
        if (wildcard === -1) return key === publicPath;
        const prefix = key.slice(0, wildcard);
        const suffix = key.slice(wildcard + 1);
        return (
            publicPath.startsWith(prefix) &&
            publicPath.endsWith(suffix) &&
            publicPath.length >= prefix.length + suffix.length
        );
    });
    return matches.toSorted((left, right) => {
        const leftWildcard = left.indexOf("*");
        const rightWildcard = right.indexOf("*");
        if (leftWildcard === -1 || rightWildcard === -1) {
            return leftWildcard === -1 ? -1 : 1;
        }
        if (leftWildcard !== rightWildcard) return rightWildcard - leftWildcard;
        return right.length - left.length;
    })[0];
};

const exportTargetMatch = (target: string, relativeFile: string) => {
    const wildcard = target.indexOf("*");
    if (wildcard === -1) {
        return target === relativeFile ? "" : undefined;
    }
    const prefix = target.slice(0, wildcard);
    const suffix = target.slice(wildcard + 1);
    return relativeFile.startsWith(prefix) && relativeFile.endsWith(suffix)
        ? relativeFile.slice(prefix.length, relativeFile.length - suffix.length)
        : undefined;
};

/** Whether adding a package-relative file would create an active public export. */
export const packageExportsSelectFile = (
    exportsValue: unknown,
    relativeFile: string,
    runtime: HotRuntimeName
) => {
    if (
        typeof exportsValue !== "object" ||
        exportsValue === null ||
        Array.isArray(exportsValue)
    ) {
        const target = exportTargetForRuntime(exportsValue, runtime);
        return Boolean(
            target && exportTargetMatch(target, relativeFile) !== undefined
        );
    }
    const exportMap = exportsValue as Record<string, unknown>;
    const exportKeys = Object.keys(exportMap).filter(key =>
        key.startsWith(".")
    );
    if (exportKeys.length === 0) {
        const target = exportTargetForRuntime(exportsValue, runtime);
        return Boolean(
            target && exportTargetMatch(target, relativeFile) !== undefined
        );
    }
    for (const declaredPath of exportKeys) {
        const target = exportTargetForRuntime(exportMap[declaredPath], runtime);
        if (!target) continue;
        const star = exportTargetMatch(target, relativeFile);
        if (star === undefined) continue;
        const publicPath = declaredPath.replaceAll("*", () => star);
        const selectedKey = matchingExportKey(publicPath, exportKeys);
        const selectedTarget = selectedKey
            ? exportTargetForRuntime(exportMap[selectedKey], runtime)
            : undefined;
        if (
            selectedTarget &&
            exportTargetMatch(selectedTarget, relativeFile) !== undefined
        ) {
            return true;
        }
    }
    return false;
};

export const discoverAnalysisEntries = async (
    input: string,
    selectedEntry: string,
    packageInfo: PackageInfo,
    runtime: HotRuntimeName,
    diagnostics: string[]
) => {
    const entries: AnalysisEntry[] = [{ file: selectedEntry, publicPath: "." }];
    if (!(await isPackageRootInput(input, packageInfo))) return entries;
    if (
        typeof packageInfo.exports !== "object" ||
        packageInfo.exports === null ||
        Array.isArray(packageInfo.exports)
    ) {
        return entries;
    }
    const exportKeys = Object.keys(packageInfo.exports).filter(key =>
        key.startsWith(".")
    );
    if (exportKeys.length === 0) return entries;
    const importer = join(packageInfo.root, "check-hot.public-exports.mjs");
    const manifestExports = packageInfo.exports as Record<string, unknown>;
    const publicPaths: string[] = [];
    for (const declaredPath of exportKeys) {
        const runtimeTarget = exportTargetForRuntime(
            manifestExports[declaredPath],
            runtime
        );
        // Type-only and explicit null branches are not public runtime exports.
        // Silently skip them just as the selected native loader does.
        if (!runtimeTarget) continue;
        const targetExtension = runtimeTarget
            ? extname(runtimeTarget.replaceAll("*", "check-hot"))
            : "";
        if (targetExtension && !supportedExtensions.includes(targetExtension)) {
            continue;
        }
        if (!declaredPath.includes("*")) {
            publicPaths.push(declaredPath);
            continue;
        }
        // oxlint-disable-next-line no-await-in-loop -- Each pattern has its own runtime-selected filesystem target.
        const expanded = await expandPublicExportPattern(
            declaredPath,
            manifestExports[declaredPath],
            packageInfo,
            runtime
        );
        if (expanded.length === 0 && runtimeTarget.split("*").length !== 2) {
            diagnostics.push(
                `${join(packageInfo.root, "package.json")}: public export pattern ${JSON.stringify(declaredPath)} could not be exhaustively enumerated; analyze its concrete subpaths explicitly`
            );
        } else {
            publicPaths.push(
                ...expanded.filter(
                    publicPath =>
                        matchingExportKey(publicPath, exportKeys) ===
                        declaredPath
                )
            );
        }
    }
    for (const publicPath of new Set(publicPaths)) {
        if (publicPath === ".") continue;
        const request = `${packageInfo.name}${publicPath.slice(1)}`;
        // oxlint-disable-next-line no-await-in-loop -- Public subpaths are resolved independently through runtime conditions.
        const resolution = await resolveSourceRequest(
            importer,
            request,
            runtime
        );
        if (!resolution.path) {
            if (resolution.resolvedPath) continue;
            diagnostics.push(
                `${join(packageInfo.root, "package.json")}: unable to resolve public export ${JSON.stringify(publicPath)} for ${runtime} (${resolution.error ?? "no supported JS/TS source"})`
            );
            continue;
        }
        if (
            !entries.some(
                entry =>
                    entry.file === resolution.path &&
                    entry.publicPath === publicPath
            )
        ) {
            entries.push({
                file: resolution.path,
                publicPath
            });
        }
    }
    return entries;
};

export const isInside = (root: string, path: string) => {
    const fragment = relative(root, path);
    return (
        fragment === "" ||
        (!fragment.startsWith(`..${sep}`) && fragment !== "..")
    );
};
