import { fileURLToPath } from "node:url";
import structure from "./structure.json" with { type: "json" };

export type ExampleFramework = keyof typeof structure.frameworks;

export const exampleFrameworkDefinitions = structure.frameworks;
export const exampleFrameworks = Object.keys(
    exampleFrameworkDefinitions
) as ExampleFramework[];

export interface ExampleLocation {
    framework: ExampleFramework;
    groupPath: string;
    implementationPath: string;
    route: string;
}

export const examplesDirectory = fileURLToPath(
    new URL(`./${structure.sourceDirectory}`, import.meta.url)
);

export const examplesImportPrefix = `@af-utils/examples/${structure.sourceDirectory}/`;

export const examplesRepositoryDirectory = `examples/${structure.sourceDirectory}`;

export const exampleEntryFiles = Object.fromEntries(
    exampleFrameworks.map(framework => [
        framework,
        exampleFrameworkDefinitions[framework].entryFile
    ])
) as Record<ExampleFramework, string>;

export const getExampleEntryFile = (framework: ExampleFramework) =>
    exampleEntryFiles[framework];

export const getExampleFrameworkDefinition = (framework: ExampleFramework) =>
    exampleFrameworkDefinitions[framework];

const isExampleFramework = (value: string): value is ExampleFramework =>
    exampleFrameworks.some(framework => framework === value);

export const getExampleLocation = (
    implementationPath: string
): ExampleLocation => {
    const segments = implementationPath.split("/");
    const framework = segments.at(-1) ?? "";

    if (!isExampleFramework(framework)) {
        throw new Error(
            `Example implementation must end with a framework: ${implementationPath}`
        );
    }

    const groupSegments = segments.slice(0, -1);
    const groupPath = groupSegments.join("/");
    if (groupSegments[0] !== "virtual") {
        return {
            framework,
            groupPath,
            implementationPath,
            route: implementationPath
        };
    }

    const category = groupSegments[1] ?? "";
    if (!category) throw new Error(`Missing example category: ${groupPath}`);

    const definition = getExampleFrameworkDefinition(framework);
    const aliases =
        "routeCategoryAliases" in definition
            ? definition.routeCategoryAliases
            : undefined;
    const routeCategory =
        aliases?.[category as keyof typeof aliases] ?? category;
    const route = [
        "virtual",
        framework,
        routeCategory,
        ...groupSegments.slice(2)
    ].join("/");

    return { framework, groupPath, implementationPath, route };
};

export const getExampleImplementationPath = (route: string) => {
    const segments = route.split("/");
    if (segments[0] !== "virtual") return route;

    const framework = segments[1] ?? "";
    const routeCategory = segments[2] ?? "";
    if (!isExampleFramework(framework)) {
        throw new Error(`Unknown example framework in route: ${route}`);
    }

    const definition = getExampleFrameworkDefinition(framework);
    const aliases =
        "routeCategoryAliases" in definition
            ? definition.routeCategoryAliases
            : {};
    const category =
        Object.entries(aliases).find(
            ([, alias]) => alias === routeCategory
        )?.[0] ?? routeCategory;
    return ["virtual", category, ...segments.slice(3), framework].join("/");
};

export const getExampleRouteEntryFile = (route: string) =>
    getExampleEntryFile(
        getExampleLocation(getExampleImplementationPath(route)).framework
    );

export const getExampleRepositoryPath = (route: string) =>
    `${examplesRepositoryDirectory}/${getExampleImplementationPath(route)}`;
