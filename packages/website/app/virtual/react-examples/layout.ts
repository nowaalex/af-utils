import type { Metadata } from "next";

export const metadata = {
    title: {
        template: "%s Example | af-utils | Virtual",
        default: "Example"
    }
} satisfies Metadata;

const EmptyLayout = (v: any) => v.children;

export default EmptyLayout;
