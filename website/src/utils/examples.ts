import {
    type ExampleFramework,
    getExampleImplementationPath
} from "@af-utils/examples/config";
import {
    exampleCodeSources,
    exampleDefinitions,
    exampleFileSources,
    examplePaths,
    exampleReadmeSources,
    exampleReadmes
} from "@af-utils/examples/src/catalog";
import type { MenuItem } from "components/Menu.astro";
import _ from "lodash";
import type { BundledLanguage } from "shiki";

export { examplePaths };
export const readmes = exampleReadmes;

export interface Params {
    params: { example: string[] };
}

type MenuMap = { [key: string]: MenuMap };

function walkMenu(
    obj: MenuMap | undefined,
    path: string,
    depth = 0
): MenuItem[] {
    return obj
        ? Object.keys(obj)
              .toSorted((a, b) => a.localeCompare(b))
              .map(k => {
                  const newPath = `${path}/${_.kebabCase(k)}`;
                  return {
                      name: _.startCase(k),
                      path: newPath,
                      collapsible: depth === 1,
                      children: walkMenu(obj[k], newPath, depth + 1)
                  } as const satisfies MenuItem;
              })
        : [];
}
export interface ExampleFile {
    name: string;
    url: string;
}

interface ExampleSourceFile extends ExampleFile {
    /** Loads the raw source during static route generation. */
    load: () => Promise<string>;
    path: string;
}

const languageByExtension = {
    css: "css",
    html: "html",
    js: "js",
    jsx: "jsx",
    json: "json",
    ts: "ts",
    tsx: "tsx"
} as const satisfies Record<string, BundledLanguage>;

export function getExampleFileLanguage(fileName: string): BundledLanguage {
    const extension = fileName.split(".").at(-1) ?? "";
    return (
        languageByExtension[extension as keyof typeof languageByExtension] ??
        "text"
    );
}

export function getExampleSourceFiles(path: string): ExampleSourceFile[] {
    const prefix = `${getExampleImplementationPath(path)}/`;
    return Object.entries(exampleFileSources)
        .filter(
            ([filePath]) =>
                filePath.startsWith(prefix) &&
                !filePath.slice(prefix.length).startsWith("dist/")
        )
        .map(([filePath, load]) => {
            const name = filePath.slice(prefix.length);
            return {
                load,
                name,
                path,
                url: `/example-source/${path}/${name}.html`
            };
        })
        .toSorted((a, b) => {
            if (a.name === "src/code.tsx") return -1;
            if (b.name === "src/code.tsx") return 1;
            if (a.name.startsWith("src/") !== b.name.startsWith("src/")) {
                return a.name.startsWith("src/") ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
}

export function getExampleFiles(path: string): ExampleFile[] {
    return getExampleSourceFiles(path).map(({ name, url }) => ({ name, url }));
}

export function getAllExampleSourceFiles(): ExampleSourceFile[] {
    return examplePaths.flatMap(path => getExampleSourceFiles(path));
}

const getDescriptionFromReadme = (readme: string) => {
    const paragraph = readme
        .replace(/^---[\s\S]*?---\s*/u, "")
        .split(/\n\s*\n/u)
        .find(value => value.trim());

    return (paragraph ?? "")
        .replace(/!\[([^\]]*)\]\([^)]*\)/gu, "$1")
        .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
        .replace(/[`*_~]/gu, "")
        .replace(/\s+/gu, " ")
        .trim();
};

export async function getExampleDescription(path: string) {
    const loadReadme = exampleReadmeSources[path];
    if (!loadReadme) throw new Error(`Missing example README: ${path}`);
    return getDescriptionFromReadme(await loadReadme());
}

export const getProjectExamples = (projectName: string) =>
    examplePaths.filter(k => k.startsWith(projectName));

export const getMenuMapForProjectExamples = (projectName: string) =>
    walkMenu(
        getProjectExamples(projectName).reduce<MenuMap>(
            (result, path) =>
                _.set(result, path.split("/").with(0, "examples"), null),
            {}
        ),
        `/${projectName}`
    );

export const getAlternativeExamples = (path: string) => {
    const current = exampleDefinitions.find(example => example.route === path);
    if (!current) throw new Error(`Unknown example path: ${path}`);

    return exampleDefinitions.filter(
        example =>
            example.groupPath === current.groupPath && example.route !== path
    );
};

export const getExamplePagePath = (path: string) => {
    const [project, ...segments] = path.split("/");
    return `/${project}/examples/${segments.join("/")}`;
};

export interface RelatedExample {
    description: string;
    framework: ExampleFramework;
    path: string;
    title: string;
}

export interface ReferenceMetadata {
    package: string;
    referencePath: string;
    symbol: string;
}

const MAX_INFERRED_RELATED_EXAMPLES = 6;

const getReferenceLinks = (source: string) =>
    new Set(
        Array.from(
            source.matchAll(
                /(?:https?:\/\/[^/)\s]+)?(\/virtual\/reference\/[^)#\s]+)(?:#[^)\s]+)?/giu
            ),
            match => match[1]!.toLowerCase()
        )
    );

const getImportedSymbols = (source: string) => {
    const imported = new Set<string>();
    const pattern =
        /import\s+(?:type\s+)?([\s\S]*?)\s+from\s+["'](@af-utils\/[^"']+)["']/gu;

    for (const match of source.matchAll(pattern)) {
        const clause = match[1] ?? "";
        const packageName = match[2];
        if (!packageName) continue;
        const named = clause.match(/\{([\s\S]*?)\}/u)?.[1];
        if (!named) continue;

        for (const specifier of named.split(",")) {
            const symbol = specifier
                .trim()
                .replace(/^type\s+/u, "")
                .split(/\s+as\s+/u)[0]
                ?.trim();
            if (symbol) imported.add(`${packageName}:${symbol}`);
        }
    }

    return imported;
};

const formatExampleTitle = (groupPath: string) => {
    const name = groupPath.split("/").at(-1) ?? groupPath;
    return name
        .split("-")
        .map(word => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
        .join(" ");
};

interface IndexedExample {
    description: string;
    framework: ExampleFramework;
    groupPath: string;
    importedSymbols: Set<string>;
    referenceLinks: Set<string>;
    route: string;
}

let indexedExamplesPromise: Promise<IndexedExample[]> | undefined;

const getIndexedExamples = () =>
    (indexedExamplesPromise ??= Promise.all(
        exampleDefinitions.map(async example => {
            const loadReadme = exampleReadmeSources[example.route];
            const loadCode = exampleCodeSources[example.route];
            if (!loadReadme || !loadCode) {
                throw new Error(`Missing example sources: ${example.route}`);
            }

            const [readme, code] = await Promise.all([
                loadReadme(),
                loadCode()
            ]);
            return {
                description: getDescriptionFromReadme(readme),
                framework: example.framework,
                groupPath: example.groupPath,
                importedSymbols: getImportedSymbols(code),
                referenceLinks: getReferenceLinks(readme),
                route: example.route
            } satisfies IndexedExample;
        })
    ));

export async function getRelatedExamples({
    package: packageName,
    referencePath,
    symbol
}: ReferenceMetadata): Promise<RelatedExample[]> {
    const normalizedReferencePath = referencePath.toLowerCase();
    const importedSymbol = `${packageName}:${symbol}`;
    const matches = (await getIndexedExamples()).map(example => {
        const explicitlyLinked = example.referenceLinks.has(
            normalizedReferencePath
        );
        if (
            !explicitlyLinked &&
            (!packageName ||
                !symbol ||
                symbol.includes(".") ||
                !example.importedSymbols.has(importedSymbol))
        ) {
            return null;
        }

        return {
            example: {
                description: example.description,
                framework: example.framework,
                path: getExamplePagePath(example.route),
                title: formatExampleTitle(example.groupPath)
            } satisfies RelatedExample,
            explicitlyLinked
        };
    });

    const candidates = matches.filter(
        (candidate): candidate is NonNullable<typeof candidate> =>
            candidate !== null
    );
    const explicit = candidates.filter(candidate => candidate.explicitlyLinked);
    const inferred = candidates.filter(
        candidate => !candidate.explicitlyLinked
    );

    return [
        ...explicit,
        ...inferred.slice(
            0,
            Math.max(0, MAX_INFERRED_RELATED_EXAMPLES - explicit.length)
        )
    ].map(candidate => candidate.example);
}
