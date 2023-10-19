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
                .sync("./app/virtual/react-examples/**/page.{js,tsx}")
                .reduce(
                    (result, path) => (
                        path
                            .replace(/^.+react-examples\//, "")
                            .replace(/\/page.+$/, "")
                            .split("/")
                            .reduce((acc, v) => (acc[v] ||= {}), result),
                        result
                    ),
                    {}
                )
        },
        i18n: {
            locales: ["en"],
            defaultLocale: "en"
        },
        pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
        reactStrictMode: true,
        async redirects() {
            return [
                {
                    source: "/virtual/reference",
                    destination: "/virtual/reference/index.md",
                    permanent: true
                },
                {
                    source: "/virtual/examples/:example*",
                    destination: "/virtual/react-examples/:example*",
                    permanent: true
                },
                {
                    source: "/virtual/react-examples",
                    destination: "/virtual/react-examples/list/simple",
                    permanent: true
                },
                {
                    source: "/virtual/react-examples/:type",
                    destination: "/virtual/react-examples/:type/simple",
                    permanent: true
                },
                {
                    source: "/virtual/headless",
                    destination: "/virtual",
                    permanent: true
                }
            ];
        }
    })
);

export default config;
