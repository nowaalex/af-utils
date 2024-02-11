import glob from "fast-glob";
import type { MetadataRoute } from "next";

const URL = process.env.NEXT_PUBLIC_ORIGIN as string;

const sitemap = () => {
    const staticPaths = glob
        .sync([
            "app/**/page.*",
            "!**/virtual/react-examples",
            "!**/virtual/reference"
        ])
        .map(fileName => ({
            url: `${URL}/${fileName.split("/").slice(1, -1).join("/")}`
        }));

    const virtualReactExamplePaths = glob
        .sync("../../../examples/virtual/react/**/src/code.tsx")
        .map(fileName => ({
            url: `${URL}/virtual/${fileName.split("/").slice(5, -2).join("/")}`
        }));

    const virtualReferencePaths = glob.sync("reference/*.md").map(fileName => ({
        url: `${URL}/virtual/${fileName}`
    }));

    return [
        ...staticPaths,
        ...virtualReactExamplePaths,
        ...virtualReferencePaths
    ] satisfies MetadataRoute.Sitemap;
};

export default sitemap;
