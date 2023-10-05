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
    options: {
        remarkPlugins: [remarkGfm, remarkToc],
        rehypePlugins: [
            [rehypePrettyCode, { theme: "one-dark-pro", keepBackground: true }],
            rehypeSlug
        ]
    }
});

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
                    source: "/examples/:v*",
                    destination: "/virtual/examples/:v*",
                    permanent: true
                },
                {
                    source: "/docs/:d*",
                    destination: "/virtual",
                    permanent: true
                },
                {
                    source: "/why",
                    destination: "/virtual",
                    permanent: true
                },
                ...["/headless", "/size", "/table", "/list"].map(oldPath => ({
                    source: oldPath,
                    destination: `/virtual${oldPath}`,
                    permanent: true
                }))
            ];
        }
    })
);

export default config;
