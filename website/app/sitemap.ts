import glob from "fast-glob";
import { execSync } from "node:child_process";
import { getProjectExamples, getProjectExamplesPath } from "utils/examples";
import type { MetadataRoute } from "next";

const URL = process.env.NEXT_PUBLIC_ORIGIN as string;

const fmt = (file: string) =>
    execSync(`git log -1 --pretty="format:%cI" ${file}`) + "";

function sitemap() {
    const staticPaths = glob
        .sync([
            "app/**/page.*",
            "!**/virtual/examples",
            "!**/virtual/reference",
            "!**/scrollend-polyfill/examples"
        ])
        .map(fileName => ({
            url: `${URL}/${fileName.split("/").slice(1, -1).join("/")}`,
            changeFrequency: "weekly" as const,
            lastModified: fmt(fileName)
        }));

    const examplesPath = getProjectExamplesPath();

    const examples = getProjectExamples("*").map(e => ({
        url: URL + "/" + e.toSpliced(1, 0, "examples").join("/"),
        changeFrequency: "weekly" as const,
        lastModified: fmt(examplesPath + e.join("/"))
    }));

    const virtualReferencePaths = glob.sync("reference/*.md").map(fileName => ({
        url: `${URL}/virtual/${fileName}`,
        changeFrequency: "weekly" as const,
        lastModified: fmt(fileName)
    }));

    return [
        ...staticPaths,
        ...examples,
        ...virtualReferencePaths
    ] satisfies MetadataRoute.Sitemap;
}

export default sitemap;
