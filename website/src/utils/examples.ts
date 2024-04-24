import type { SEOProps } from "astro-seo";
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
    sliceTo?: number
) =>
    Object.fromEntries(
        Object.keys(source).map(k => [
            k.slice("../../../examples/src/".length, sliceTo),
            source[k]
        ])
    ) as T;

export const codes = /* @__PURE__ */ cutObjectKeys(
    import.meta.glob<string>(
        ["../../../examples/src/**/src/code.tsx", "!**/lib/**"],
        { import: "default", query: "?raw" }
    ),
    -"/src/code.tsx".length
);

export const readmes = /* @__PURE__ */ cutObjectKeys(
    import.meta.glob<astroHTML.JSX.Element>(
        ["../../../examples/src/**/README.md", "!**/lib/**"],
        {
            import: "Content"
        }
    ),
    -"/README.md".length
);

export const metas = /* @__PURE__ */ cutObjectKeys(
    import.meta.glob<SEOProps>(
        ["../../../examples/src/**/meta.ts", "!**/lib/**"],
        {
            import: "default"
        }
    ),
    -"/meta.ts".length
);

export const list = /* @__PURE__ */ Object.keys(codes);

export const getProjectExamples = (projectName: string) =>
    list.filter(k => k.startsWith(projectName));

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
