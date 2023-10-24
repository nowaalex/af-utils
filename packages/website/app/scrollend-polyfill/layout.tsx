import getDocumentationLayout from "components/layouts/Documentation";
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
    }
] as const;

export default getDocumentationLayout(
    items,
    "/scrollend-polyfill",
    "scrollend-polyfill"
);
