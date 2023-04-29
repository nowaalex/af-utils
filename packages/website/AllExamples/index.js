import dynamic from "next/dynamic";
import startCase from "/utils/startCase";

const EXCEPTIONS = {
    complexTable: "Complex Table (unstable)",
    StickyHeaderAndFooter: "Sticky Header and Footer"
};

const getPathInfo = path => {
    const short = path.slice(2).replace(/\/[^/]+\.(js|mdx)$/, "");
    return {
        staticPaths: short.split("/"),
        short,
        path
    };
};

const requireComponent = require.context(
    "/components/examples",
    true,
    /index\.js$/,
    "lazy"
);
const requireCode = require.context(
    "!!code-webpack-loader!/components/examples",
    true,
    /index\.js$/,
    "lazy"
);

const requireDescription = require.context(
    "/components/examples",
    true,
    /index\.mdx$/,
    "lazy"
);

const requireMeta = require.context("/components/examples", true, /meta\.js$/);

export const components = requireComponent.keys().map(getPathInfo);

const table = components.reduce(
    (acc, v) => (
        (acc[v.short] = {
            title: v.staticPaths
                .map(v => EXCEPTIONS[v] || startCase(v))
                .join(" / "),
            Component: dynamic(() => requireComponent(v.path), {
                ssr: false
            }),
            Code: dynamic(() => requireCode(v.path), { ssr: false }),
            meta: null,
            Description: null
        }),
        acc
    ),
    {}
);

requireDescription
    .keys()
    .map(getPathInfo)
    .forEach(v => {
        table[v.short].Description = dynamic(() => requireDescription(v.path), {
            ssr: false
        });
    });

requireMeta
    .keys()
    .map(getPathInfo)
    .forEach(v => {
        table[v.short].meta = requireMeta(v.path);
    });

export { table };
