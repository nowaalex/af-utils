import kebabCase from "lodash/kebabCase";
import startCase from "lodash/startCase";

export interface Params {
    params: { example: string[] };
}

function walkMenu(obj: Record<string, any> | null, arr: any[], path: string) {
    if (obj) {
        for (const k in obj) {
            const kebabbed = kebabCase(k);
            const newPath = `${path}/${kebabbed}`;
            arr.push({
                name: startCase(k),
                path: newPath,
                children: walkMenu(obj[k], [], newPath)
            });
        }
    }
    return arr;
}

const cutObjectKeys = <T extends Record<string, any>>(
    source: T,
    sliceFrom: number,
    sliceTo: number
) =>
    Object.fromEntries(
        Object.keys(source).map(k => [k.slice(sliceFrom, sliceTo), source[k]])
    ) as T;

export const getProjectExampleCodes = () =>
    cutObjectKeys(
        import.meta.glob<string>(
            ["../../../examples/src/**/src/code.tsx", "!**/lib/**"],
            { import: "default", query: "?raw" }
        ),
        "../../../examples/src/".length,
        -"/src/code.tsx".length
    );

export const getProjectExampleDescriptions = () =>
    cutObjectKeys(
        import.meta.glob<astroHTML.JSX.Element>(
            ["../../../examples/src/**/README.md", "!**/lib/**"],
            {
                import: "Content"
            }
        ),
        "../../../examples/src/".length,
        -"/README.md".length
    );

export const getProjectExamples = (projectName: string) =>
    Object.keys(getProjectExampleCodes()).filter(k =>
        k.startsWith(projectName)
    );

export const getMenuMapForProjectExamples = (projectName: string) =>
    walkMenu(
        getProjectExamples(projectName)
            .sort((a, b) => a.localeCompare(b))
            .reduce<Record<string, any>>(
                (result, path) => (
                    path
                        .split("/")
                        .with(0, "examples")
                        .reduce((acc, v) => (acc[v] ||= {}), result),
                    result
                ),
                {}
            ),
        [],
        "/" + projectName
    );
