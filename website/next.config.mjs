import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import remarkToc from "remark-toc";
import nextMdx from "@next/mdx";
import rehypeSlug from "rehype-slug";
import nextBundleAnalyzer from "@next/bundle-analyzer";
import mergeWith from "lodash/mergeWith.js";

const CSP = [
    {
        "default-src": "'self'",
        "img-src": "'self' data: w3.org/svg/2000"
    },
    {
        "font-src": "fonts.gstatic.com",
        "style-src": "'unsafe-inline' fonts.googleapis.com"
    },
    {
        "script-src":
            "'unsafe-inline' https://*.googletagmanager.com" +
            (process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"),
        "img-src":
            "https://*.google-analytics.com https://*.googletagmanager.com",
        "connect-src":
            "https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com"
    }
].reduce((acc, obj) =>
    mergeWith(acc, obj, (v, v2) => (v || "'self'") + " " + v2)
);

const cspString = Object.entries(CSP)
    .map(([k, v]) => `${k} ${v};`)
    .join(" ");

const withBundleAnalyzer = nextBundleAnalyzer({
    enabled: process.env.ANALYZE === "true",
    openAnalyzer: false
});

const withMDX = nextMdx({
    extension: /\.mdx?$/,
    options: {
        remarkPlugins: [remarkGfm, remarkToc],
        rehypePlugins: [
            [
                rehypePrettyCode,
                { theme: "github-light", keepBackground: false }
            ],
            rehypeSlug
        ]
    }
});

/** @type {import('next').NextConfig} */
const config = withBundleAnalyzer(
    withMDX({
        pageExtensions: ["md", "mdx", "ts", "tsx"],
        reactStrictMode: true,
        async headers() {
            return [
                {
                    source: "/(.*)",
                    headers: [
                        {
                            key: "Content-Security-Policy",
                            value: cspString
                        },
                        {
                            key: "X-Content-Type-Options",
                            value: "nosniff"
                        }
                    ]
                }
            ];
        },
        async redirects() {
            return [
                {
                    source: "/virtual/reference",
                    destination: "/virtual/reference/index.md",
                    permanent: true
                },
                /** Google search console start */
                {
                    source: "/virtual/react-examples/:example*",
                    destination: "/virtual/examples/react/:example*",
                    permanent: true
                },
                {
                    source: "/docs/bundleSize",
                    destination: "/virtual/size",
                    permanent: true
                },
                {
                    source: "/virtual/examples/list/StickyHeaderAndFooter",
                    destination: "/virtual/examples/react/list/sticky-header-and-footer",
                    permanent: true
                },
                {
                    source: "/virtual/examples/list/ScrollToItem",
                    destination: "/virtual/examples/react/list/scroll-to-item",
                    permanent: true
                },
                {
                    source: "/virtual/examples/list/MaterialUI",
                    destination: "/virtual/examples/react/list/material-ui",
                    permanent: true
                },
                {
                    source: "/examples/list/LoadOnDemand",
                    destination: "/virtual/examples/react/list/load-on-demand",
                    permanent: true
                },
                {
                    source: "/examples/list/Simple",
                    destination: "/virtual/examples/react/list/simple",
                    permanent: true
                },
                {
                    source: "/examples/complexTable/basic",
                    destination: "/vitual/examples/table/basic",
                    permanent: true
                },
                {
                    source: "/virtual/examples/list/Simple",
                    destination: "/virtual/examples/react/list/simple",
                    permanent: true
                },
                {
                    source: "/list",
                    destination: "/virtual/examples/react/list/simple",
                    permanent: true
                },
                {
                    source: "/virtual/headless",
                    destination: "/virtual",
                    permanent: true
                },
                {
                    source: "/why",
                    destination: "/virtual",
                    permanent: true
                },
                {
                    source: "/virtual/list",
                    destination: "/virtual/examples/react/list/simple",
                    permanent: true
                },
                /** Google search console end */
            ];
        }
    })
);

export default config;
