import getDocumentationLayout from "components/layouts/Documentation";
import walkMenu from "utils/walkMenu";
import { getMenuMapForProjectExamples } from "utils/examples";
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

export default getDocumentationLayout(
    async function () {
        const examples =
            await getMenuMapForProjectExamples("scrollend-polyfill");

        return [
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
            ...walkMenu(examples)
        ];
    },
    "/scrollend-polyfill",
    "scrollend-polyfill"
);
