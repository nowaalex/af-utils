import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { discoverExamples } from "../examples/discovery.ts";
import { findFiles } from "./file-discovery.mjs";

const repositoryRoot = resolve(import.meta.dirname, "..");
const examplesRoot = resolve(repositoryRoot, "examples");
const templatesRoot = resolve(examplesRoot, "templates");
const structure = JSON.parse(
    await readFile(resolve(examplesRoot, "structure.json"), "utf8")
);
const examplesManifest = JSON.parse(
    await readFile(resolve(examplesRoot, "package.json"), "utf8")
);
const frameworkDefinitions = structure.frameworks;
const check = process.argv.includes("--check");
const dependencyVersions = {
    ...examplesManifest.dependencies,
    ...examplesManifest.devDependencies
};

const readVersion = async path =>
    JSON.parse(await readFile(path, "utf8")).version;

const coreVersion = await readVersion(
    resolve(repositoryRoot, "packages/virtual/core/package.json")
);
const adapterVersions = Object.fromEntries(
    await Promise.all(
        Object.entries(frameworkDefinitions).map(
            async ([framework, definition]) => [
                framework,
                await readVersion(
                    resolve(
                        repositoryRoot,
                        definition.adapterDirectory,
                        "package.json"
                    )
                )
            ]
        )
    )
);

const getDependencyVersions = names =>
    Object.fromEntries(
        names.map(name => {
            const version = dependencyVersions[name];
            if (!version) {
                throw new Error(`Missing ${name} in examples/package.json`);
            }
            return [name, version];
        })
    );

const getPackageName = specifier => {
    if (specifier.startsWith(".") || specifier.startsWith("node:")) return;
    const segments = specifier.split("/");
    return specifier.startsWith("@")
        ? segments.slice(0, 2).join("/")
        : segments[0];
};

const getImportedDependencies = source => {
    const names = [
        ...source.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/gu)
    ]
        .map(match => getPackageName(match[1]))
        .filter(name => name && !name.startsWith("@af-utils/"));

    for (const name of names) {
        if (!dependencyVersions[name]) {
            throw new Error(`Missing ${name} in examples/package.json`);
        }
    }

    return [...new Set(names)];
};

const getPackageJson = ({
    framework,
    implementationPath,
    importedDependencies
}) => {
    const segments = implementationPath.split("/");
    segments.pop();
    const project = segments.shift();
    const definition = frameworkDefinitions[framework];
    const dependencies = {
        "@af-utils/virtual-core": coreVersion,
        [definition.adapterPackage]: adapterVersions[framework],
        ...getDependencyVersions(definition.dependencies),
        ...getDependencyVersions(importedDependencies)
    };

    return `${JSON.stringify(
        {
            name: `@af-utils/${[project, "examples", framework, ...segments].join("-")}`,
            version: "0.0.1",
            private: true,
            scripts: {
                dev: "vite",
                build: definition.build,
                serve: "vite preview"
            },
            type: "module",
            dependencies,
            devDependencies: {
                ...getDependencyVersions(["typescript", "vite"]),
                ...getDependencyVersions(definition.devDependencies)
            }
        },
        null,
        4
    )}\n`;
};

const syncFile = async (path, content) => {
    if (check) {
        const current = await readFile(path, "utf8").catch(() => {});
        if (current !== content) {
            throw new Error(
                `${relative(repositoryRoot, path)} is not synchronized`
            );
        }
        return;
    }

    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
};

const templateNames = new Set(
    Object.values(frameworkDefinitions).flatMap(definition =>
        definition.template ? [definition.template] : []
    )
);
const templates = Object.fromEntries(
    await Promise.all(
        [...templateNames].map(async name => {
            const directory = resolve(templatesRoot, name);
            const files = await Promise.all(
                (await findFiles(directory)).map(async path => ({
                    content: await readFile(path, "utf8"),
                    path: relative(directory, path)
                }))
            );
            return [name, files];
        })
    )
);

await Promise.all(
    (await discoverExamples()).map(async example => {
        const definition = frameworkDefinitions[example.framework];
        const templateFiles = templates[definition.template] ?? [];

        if (templateFiles.length > 0) {
            const source = await readFile(example.entryFile, "utf8");
            await Promise.all(
                templateFiles.map(({ content, path }) =>
                    syncFile(resolve(example.directory, path), content)
                )
            );
            await syncFile(
                resolve(example.directory, "package.json"),
                getPackageJson({
                    ...example,
                    importedDependencies: getImportedDependencies(source)
                })
            );
        }

        const sharedStyle = await readFile(
            resolve(example.directory, "..", "style.module.css"),
            "utf8"
        ).catch(() => {});
        if (sharedStyle !== undefined) {
            const styleFile = resolve(
                example.directory,
                "src/style.module.css"
            );
            await syncFile(styleFile, sharedStyle);
            if (!check) await chmod(styleFile, 0o644);
        }

        const sharedReadme = await readFile(
            resolve(example.directory, "..", "README.md"),
            "utf8"
        ).catch(() => {});
        if (sharedReadme !== undefined) {
            await syncFile(
                resolve(example.directory, "README.md"),
                sharedReadme
            );
        }
    })
);
