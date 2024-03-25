import kebabCase from "lodash/kebabCase";
import startCase from "lodash/startCase";
import glob from "fast-glob";

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

export function getProjectExamplesPath() {
    return "../examples/src/";
}

export function getProjectExamples(projectName: string) {
    const postfix = "/src/code.tsx";

    const examplesPath = getProjectExamplesPath();

    const rawExamples = glob.sync(`${examplesPath}${projectName}/**${postfix}`);

    if (!rawExamples.length) {
        console.warn("no examples found by glob. Path: " + examplesPath);
    }

    return rawExamples
        .map(f => f.slice(examplesPath.length, -postfix.length))
        .sort((a, b) => a.localeCompare(b))
        .map(f => f.split("/"));
}

export function getMenuMapForProjectExamples(projectName: string) {
    const examples = getProjectExamples(projectName);

    return walkMenu(
        examples.reduce<Record<string, any>>(
            (result, path) => (
                path
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

export const getStaticParamsGenerator = (projectName: string) => () => {
    const examples = getProjectExamples(projectName);
    return examples.map(example => ({ example: example.slice(1) }));
};
