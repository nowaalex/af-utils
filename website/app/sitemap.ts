import type { MetadataRoute } from "next";
import { getProjectExamples } from "utils/examples";

const URL = process.env.NEXT_PUBLIC_ORIGIN as string;

async function sitemap() {
    const glob = await import("fast-glob");

    const staticPaths = glob.default
        .sync([
            "app/**/page.*",
            "!**/virtual/examples",
            "!**/virtual/reference",
            "!**/scrollend-polyfill/examples"
        ])
        .map(fileName => ({
            url: `${URL}/${fileName.split("/").slice(1, -1).join("/")}`
        }));

    const examples = await getProjectExamples("*");

    const virtualReferencePaths = glob.default
        .sync("reference/*.md")
        .map(fileName => ({
            url: `${URL}/virtual/${fileName}`
        }));

    return [
        ...staticPaths,
        ...examples.map(e => ({
            url: URL + "/" + e.toSpliced(1, 0, "examples").join("/")
        })),
        ...virtualReferencePaths
    ] satisfies MetadataRoute.Sitemap;
}

export default sitemap;
