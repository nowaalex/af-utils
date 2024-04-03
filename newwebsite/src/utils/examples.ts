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

function cutObjectKeys(
    source: Record<string, any>,
    sliceFrom: number,
    sliceTo: number
) {
    return Object.fromEntries(
        Object.keys(source).map(k => [k.slice(sliceFrom, sliceTo), source[k]])
    );
}

export function getProjectExampleCodes() {
    return cutObjectKeys(
        import.meta.glob(
            ["../../../examples/src/**/src/code.tsx", "!**/lib/**"],
            { import: "default", query: "?raw", eager: true }
        ),
        "../../../examples/src/".length,
        -"/src/code.tsx".length
    );
}

export function getProjectExampleDescriptions() {
    return cutObjectKeys(
        import.meta.glob(["../../../examples/src/**/README.md", "!**/lib/**"], {
            import: "Content",
            eager: true
        }),
        "../../../examples/src/".length,
        -"/README.md".length
    );
}

export function getProjectExamples(projectName: string) {
    const rawExamples = Object.keys(getProjectExampleCodes()).filter(k =>
        k.startsWith(projectName)
    );

    return rawExamples.sort((a, b) => a.localeCompare(b));
}

export function getMenuMapForProjectExamples(projectName: string) {
    const examples = getProjectExamples(projectName);
    return walkMenu(
        examples.reduce<Record<string, any>>(
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
}
