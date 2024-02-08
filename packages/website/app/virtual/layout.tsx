import getDocumentationLayout from "components/layouts/Documentation";
import glob from "fast-glob";
import walkMenu from "utils/walkMenu";
import type { Metadata } from "next";

export const metadata = {
    title: {
        template: "%s | af-utils | Virtual",
        default: "Getting started | af-utils | Virtual"
    },
    description:
        "Virtualize large lists with variable or fixed item sizes. Typescript-friendly, react and core adapters currently available",
    openGraph: {
        type: "website",
        title: {
            template: "%s | af-utils | Virtual",
            default: "Getting started | af-utils | Virtual"
        },
        description:
            "Virtualize large lists with variable or fixed item sizes. Typescript-friendly, react and core adapters currently available"
    }
} satisfies Metadata;

const map = glob
    .sync("../virtual/examples/react/**/src/code.tsx")
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
                name: "FAQ",
                path: "/faq"
            },
            {
                name: "Reference",
                path: "/reference/index.md",
                comparePath: "/reference"
            },
            {
                name: "Bundle size impact",
                path: "/size"
            }
        ]
    },
    ...walkMenu({
        reactExamples: map
    })
] as const;

export default getDocumentationLayout(items, "/virtual", "virtual");
