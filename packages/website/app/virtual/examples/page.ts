import type { Metadata } from "next";

export const metadata = {
    title: {
        template: "examples / %s",
        default: "Example"
    }
} satisfies Metadata;

export default () => null;
