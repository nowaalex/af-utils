import glob from "fast-glob";
import type { MetadataRoute } from "next";

const URL = process.env.NEXT_PUBLIC_ORIGIN as string;

const sitemap = () => {
    const staticPaths = glob
        .sync([
            "app/**/page.*",
            "!**/virtual/react-examples",
            "!**/virtual/reference",
            "!**/scrollend-polyfill/examples"
        ])
        .map(fileName => ({
            url: `${URL}/${fileName.split("/").slice(1, -1).join("/")}`
        }));

    const virtualReactExamplePaths = glob
        .sync("../examples/src/virtual/react/**/src/code.tsx")
        .map(fileName => ({
            url: `${URL}/virtual/react-examples/${fileName.split("/").slice(5, -2).join("/")}`
        }));

    const virtualReferencePaths = glob.sync("reference/*.md").map(fileName => ({
        url: `${URL}/virtual/${fileName}`
    }));

    const scrollendPolyfillExamplePaths = glob
        .sync("../examples/src/scrollend-polyfill/**/src/code.tsx")
        .map(fileName => ({
            url: `${URL}/scrollend-polyfill/examples/${fileName.split("/").slice(4, -2).join("/")}`
        }));

    return [
        ...staticPaths,
        ...virtualReactExamplePaths,
        ...virtualReferencePaths,
        ...scrollendPolyfillExamplePaths
    ] satisfies MetadataRoute.Sitemap;
};

export default sitemap;
