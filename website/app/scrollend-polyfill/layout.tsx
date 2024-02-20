import getDocumentationLayout from "components/layouts/Documentation";
import glob from "fast-glob";
import walkMenu from "utils/walkMenu";
import type { Metadata } from "next";

export const metadata = {
    title: {
        template: "%s | af-utils | Scrollend Polyfill",
        default: "Getting started | af-utils | Scrollend Polyfill"
    },
    description:
        "This polyfill adds scrollend event support via addEventListener / removeEventLister",
    openGraph: {
        type: "website",
        title: {
            template: "%s | af-utils | Scrollend Polyfill",
            default: "Getting started | af-utils | Scrollend Polyfill"
        },
        description:
            "This polyfill adds scrollend event support via addEventListener / removeEventLister"
    }
} satisfies Metadata;

const map = glob
    .sync("../examples/src/scrollend-polyfill/**/src/code.tsx")
    .reduce<Record<string, any>>(
        (result, path) => (
            path
                .split("/")
                .slice(4, -2)
                .reduce((acc, v) => (acc[v] ||= {}), result),
            result
        ),
        {}
    );

const items = [
    {
        name: "Description",
        path: "",
        children: [
            {
                name: "Getting started",
                path: "",
                exact: true
            },
            {
                name: "Bundle size impact",
                path: "/size"
            }
        ]
    },
    ...walkMenu({
        examples: map
    })
] as const;

export default getDocumentationLayout(
    items,
    "/scrollend-polyfill",
    "scrollend-polyfill"
);
