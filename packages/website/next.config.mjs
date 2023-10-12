import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import remarkToc from "remark-toc";
import nextMdx from "@next/mdx";
import rehypeSlug from "rehype-slug";
import nextBundleAnalyzer from "@next/bundle-analyzer";
import glob from "fast-glob";

const withBundleAnalyzer = nextBundleAnalyzer({
    enabled: process.env.ANALYZE === "true",
    openAnalyzer: false
});

const withMDX = nextMdx({
    extension: /\.mdx?$/,
    options: {
        remarkPlugins: [remarkGfm, remarkToc],
        rehypePlugins: [
            [rehypePrettyCode, { theme: "one-dark-pro", keepBackground: true }],
            rehypeSlug
        ]
    }
});

/** @type {import('next').NextConfig} */
const config = withBundleAnalyzer(
    withMDX({
        env: {
            VIRTUAL_EXAMPLE_ROUTES_MAP: glob
                .sync("./app/virtual/examples/**/page.{js,tsx}")
                .reduce(
                    (result, path) => (
                        path
                            .replace(/^.+examples\//, "")
                            .replace(/\/page.+$/, "")
                            .split("/")
                            .reduce((acc, v) => (acc[v] ||= {}), result),
                        result
                    ),
                    {}
                ),
            VIRTUAL_REFERENCE_MAP: Object.fromEntries(
                glob
                    .sync("./reference/*.md")
                    .map(f => [f.replace("./reference/", ""), true])
            )
        },
        i18n: {
            locales: ["en"],
            defaultLocale: "en"
        },
        pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
        reactStrictMode: true
    })
);

export default config;
