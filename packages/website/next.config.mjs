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
        pageExtensions: ["md", "mdx", "ts", "tsx"],
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
                },
                {
                    source: "/virtual/list",
                    destination: "/virtual",
                    permanent: true
                },
                {
                    source: "/virtual/table",
                    destination: "/virtual",
                    permanent: true
                },
                {
                    source: "/virtual/react-examples/list/LoadOnDemand",
                    destination: "/virtual/react-examples/list/load-on-demand",
                    permanent: true
                },
                {
                    source: "/virtual/react-examples/list/PrependItems",
                    destination: "/virtual/react-examples/list/prepend-items",
                    permanent: true
                }
            ];
        }
    })
);

export default config;
