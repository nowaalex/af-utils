import dynamic from "next/dynamic";
import startCase from "utils/startCase";
import { ElementType } from "react";

const EXCEPTIONS: Record<string, string> = {
    complexTable: "Complex Table (unstable)",
    StickyHeaderAndFooter: "Sticky Header and Footer"
} as const;

const getPathInfo = (path: string) => {
    const short = path.slice(2).replace(/\/[^/]+\.(js|tsx|mdx)$/, "");
    return {
        staticPaths: short.split("/"),
        short,
        path
    };
};

const requireComponent = require.context(
    "../components/examples",
    true,
    /index\.(js|tsx)$/,
    "lazy"
);
const requireCode = require.context(
    "!!code-webpack-loader!../components/examples",
    true,
    /index\.(js|tsx)$/,
    "lazy"
);

const requireDescription = require.context(
    "../components/examples",
    true,
    /index\.mdx$/,
    "lazy"
);

const requireMeta = require.context(
    "../components/examples",
    true,
    /meta\.(js|ts|tsx)$/
);

export const components = requireComponent.keys().map(getPathInfo);

export const table = Object.fromEntries(
    components.map(v => [
        v.short,
        {
            title: v.staticPaths
                .map(v => EXCEPTIONS[v] || startCase(v))
                .join(" / "),
            Component: dynamic(() => requireComponent(v.path), {
                ssr: false
            }),
            Code: dynamic(() => requireCode(v.path), { ssr: false }),
            meta: null,
            Description: null as ElementType | null
        }
    ])
);

if (process.env.NODE_ENV !== "production") {
    console.table(components);
}

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
