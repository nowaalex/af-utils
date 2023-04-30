import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import remarkToc from "remark-toc";
import nextMdx from "@next/mdx";
import rehypeSlug from "rehype-slug";
import nextBundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = nextBundleAnalyzer({
    enabled: process.env.ANALYZE === "true",
    openAnalyzer: false
});

const withMDX = nextMdx({
    options: {
        providerImportSource: "@mdx-js/react",
        remarkPlugins: [remarkGfm, remarkToc],
        rehypePlugins: [
            [rehypePrettyCode, { theme: "one-dark-pro", keepBackground: true }],
            rehypeSlug
        ]
    }
});

const config = withBundleAnalyzer(
    withMDX({
        i18n: {
            locales: ["en"],
            defaultLocale: "en"
        },
        pageExtensions: ["js", "jsx", "md", "mdx"],
        reactStrictMode: true,
        webpack(config) {
            if (config.optimization?.splitChunks) {
                config.optimization.splitChunks.minSize = 1024;
            }
            return config;
        },
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
