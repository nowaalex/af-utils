import getDocumentationLayout from "components/layouts/Documentation";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        template: "%s | af-utils | Scrollend Polyfill",
        default: "Getting started | af-utils | Scrollend Polyfill"
    }
};

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
