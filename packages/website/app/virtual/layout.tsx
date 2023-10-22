import getDocumentationLayout from "components/layouts/Documentation";
import glob from "fast-glob";
import walkMenu from "utils/walkMenu";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        template: "%s | af-utils | Virtual",
        default: "Getting started | af-utils | Virtual"
    }
};

const map = glob
    .sync("./components/examples/react-examples/**/code.tsx")
    .reduce<Record<string, any>>(
        (result, path) => (
            path
                .replace(/^.+react-examples\//, "")
                .replace(/\/code.+$/, "")
                .split("/")
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
                path: "/reference"
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
