"use server";

import kebabCase from "lodash/kebabCase";
import startCase from "lodash/startCase";
import glob from "fast-glob";
import { execSync } from "node:child_process";

import type { MenuItem } from "components/Menu";
import type { Metadata } from "next";

export interface Params {
    params: { example: string[] };
}

function walkMenu(
    obj: Record<string, any> | null,
    arr: MenuItem[],
    path: string
) {
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

export async function getProjectExamples(projectName: string) {
    const postfix = "/src/code.tsx";

    const examplesPath = execSync("pnpm --filter @af-utils/examples exec pwd")
        .toString()
        .replace(/\s*$/, "/src/");

    return glob
        .sync(`${examplesPath}${projectName}/**${postfix}`)
        .map(f => f.slice(examplesPath.length, -postfix.length))
        .sort((a, b) => a.localeCompare(b))
        .map(f => f.split("/"));
}

export async function getMenuMapForProjectExamples(projectName: string) {
    const examples = await getProjectExamples(projectName);

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

export const getStaticParamsGenerator = (projectName: string) => async () => {
    const examples = await getProjectExamples(projectName);
    return examples.map(example => ({ example: example.slice(1) }));
};

export const getMetadataGenerator =
    (projectName: string) =>
    async ({ params }: Params) => {
        const title = `${startCase(params.example.toReversed().join(" "))} Example`;

        let description = "";

        try {
            const descriptionModule = await import(
                `@af-utils/examples/src/${projectName}/${params.example.join("/")}/meta.ts`
            );

            description = descriptionModule?.default?.description;
        } catch (e) {
            description = "Missing example";
        }

        return {
            title,
            description,
            openGraph: {
                title,
                description
            }
        } satisfies Metadata;
    };
