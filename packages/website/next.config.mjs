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
                { theme: "material-theme-palenight", keepBackground: true }
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
                },
                {
                    source: "/virtual/react-examples/list/VariableSizeList",
                    destination:
                        "/virtual/react-examples/list/variable-size-list",
                    permanent: true
                },
                {
                    source: "/virtual/react-examples/list/ExtraEvents",
                    destination: "/virtual/react-examples/list/extra-events",
                    permanent: true
                },
                {
                    source: "/windowScroll",
                    destination: "/virtual/react-examples/hook/window-scroll",
                    permanent: true
                }
            ];
        }
    })
);

export default config;
