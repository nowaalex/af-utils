import kebabCase from "lodash/kebabCase";
import startCase from "lodash/startCase";
import type { SEOProps } from "astro-seo";
import type { MenuItem } from "components/Menu.astro";

export interface Params {
    params: { example: string[] };
}

type MenuMap = { [key: string]: MenuMap };

function walkMenu(obj: MenuMap | undefined, path: string): MenuItem[] {
    return obj
        ? Object.keys(obj)
              .sort((a, b) => a.localeCompare(b))
              .map(k => {
                  const newPath = `${path}/${kebabCase(k)}`;
                  return {
                      name: startCase(k),
                      path: newPath,
                      children: walkMenu(obj[k], newPath)
                  } as const satisfies MenuItem;
              })
        : [];
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

const list = Object.keys(codes);

export const getProjectExamples = (projectName: string) =>
    list.filter(k => k.startsWith(projectName));

export const getMenuMapForProjectExamples = (projectName: string) =>
    walkMenu(
        getProjectExamples(projectName).reduce<MenuMap>(
            (result, path) => (
                path
                    .split("/")
                    .with(0, "examples")
                    .reduce((acc, v) => (acc[v] ||= {}), result),
                result
            ),
            {}
        ),
        "/" + projectName
    );
