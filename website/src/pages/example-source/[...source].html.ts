import type { APIRoute, GetStaticPaths } from "astro";
import { codeToHtml } from "shiki";
import {
    getAllExampleSourceFiles,
    getExampleFileLanguage
} from "utils/examples";
import { codeTheme } from "utils/codeTheme";

interface Props {
    name: string;
    source: string;
}

export const getStaticPaths = (() =>
    Promise.all(
        getAllExampleSourceFiles().map(async file => ({
            params: { source: `${file.path}/${file.name}` },
            props: { name: file.name, source: await file.load() }
        }))
    )) satisfies GetStaticPaths;

export const GET: APIRoute<Props> = async ({ props }) => {
    const html = await codeToHtml(props.source, {
        lang: getExampleFileLanguage(props.name),
        theme: codeTheme,
        transformers: [
            {
                pre({ properties }) {
                    properties.class = "example-source-code";
                    properties.tabindex = 0;
                    properties["aria-label"] = `Source code for ${props.name}`;
                    properties["data-example-source"] = true;
                    properties["data-theme"] = codeTheme;
                }
            }
        ]
    });

    return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
    });
};
