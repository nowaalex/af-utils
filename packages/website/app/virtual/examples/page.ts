import type { Metadata } from "next";

export const metadata = {
    title: {
        template: "examples / %s",
        default: "Example"
    }
} satisfies Metadata;

const Page = () => null;

export default Page;
