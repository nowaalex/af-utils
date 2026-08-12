import { exampleEntryFiles, getExampleLocation } from "../config";

const normalizeKeys = <Value>(
    source: Record<string, Value>,
    sliceTo?: number
) =>
    Object.fromEntries(
        Object.keys(source).map(key => [
            key.slice("./".length, sliceTo),
            source[key]
        ])
    ) as Record<string, Value>;

const discoveredExampleFileSources = import.meta.glob<string>(
    ["./**/*", "!./**/node_modules/**", "!./**/dist/**", "!./**/CHANGELOG.md"],
    { import: "default", query: "?raw" }
);

export const exampleFileSources = /* @__PURE__ */ normalizeKeys(
    discoveredExampleFileSources
);

const codeSourcesByImplementation = /* @__PURE__ */ Object.fromEntries(
    Object.entries(exampleFileSources)
        .map(([filePath, load]) => {
            const match = Object.entries(exampleEntryFiles).find(
                ([framework, entryFile]) =>
                    filePath.endsWith(`/${framework}/${entryFile}`)
            );
            if (!match) return null;
            const entrySuffix = `/${match[1]}`;
            return [filePath.slice(0, -entrySuffix.length), load] as const;
        })
        .filter(entry => entry !== null)
);

export const exampleDefinitions = Object.keys(codeSourcesByImplementation)
    .map(path => getExampleLocation(path))
    .toSorted((left, right) => left.route.localeCompare(right.route));

export const examplePaths = exampleDefinitions.map(({ route }) => route);

const exampleReadmesByImplementation = /* @__PURE__ */ normalizeKeys(
    import.meta.glob<astroHTML.JSX.Element>(
        ["./**/README.md", "!./**/dist/**"],
        { import: "Content" }
    ),
    -"/README.md".length
);

const exampleReadmeSourcesByImplementation = /* @__PURE__ */ normalizeKeys(
    import.meta.glob<string>(["./**/README.md", "!./**/dist/**"], {
        import: "default",
        query: "?raw"
    }),
    -"/README.md".length
);

const mapImplementationSourcesToRoutes = <Value>(
    sources: Record<string, Value>
) =>
    Object.fromEntries(
        exampleDefinitions.flatMap(({ implementationPath, route }) => {
            const source = sources[implementationPath];
            return source === undefined ? [] : [[route, source]];
        })
    ) as Record<string, Value>;

export const exampleReadmes = /* @__PURE__ */ mapImplementationSourcesToRoutes(
    exampleReadmesByImplementation
);

export const exampleReadmeSources =
    /* @__PURE__ */ mapImplementationSourcesToRoutes(
        exampleReadmeSourcesByImplementation
    );

export const exampleCodeSources =
    /* @__PURE__ */ mapImplementationSourcesToRoutes(
        codeSourcesByImplementation
    );
