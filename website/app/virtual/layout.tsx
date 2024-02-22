import getDocumentationLayout from "components/layouts/Documentation";
import { getMenuMapForProjectExamples } from "utils/examples";
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

export default getDocumentationLayout(async function () {
    const examples = await getMenuMapForProjectExamples("virtual");

    return [
        {
            name: "Description",
            path: "",
            children: [
                {
                    name: "Getting started",
                    path: "/virtual",
                    exact: true
                },
                {
                    name: "FAQ",
                    path: "/virtual/faq"
                },
                {
                    name: "Reference",
                    path: "/virtual/reference/index.md",
                    comparePath: "/virtual/reference"
                },
                {
                    name: "Bundle size impact",
                    path: "/virtual/size"
                }
            ]
        },
        ...examples
    ];
}, "virtual");
