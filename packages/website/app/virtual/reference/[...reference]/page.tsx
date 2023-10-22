import nextDynamic from "next/dynamic";
import startCase from "lodash/startCase";
import type { Metadata } from "next";

type Params = { params: { reference: string[] } };

export const dynamicParams = false;

export async function generateStaticParams() {
    const glob = await import("fast-glob");

    const result = glob.default
        .sync("reference/*.md")
        .map(f => ({ reference: f.split("/").slice(1) }));

    return result;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    return {
        title: `${params.reference
            .join("")
            .replace(".md", "")
            .split(".")
            .map(startCase)
            .join(" | ")} | Reference`
    };
}

const Cache: Record<string, ReturnType<typeof nextDynamic>> = {};

const Page = ({ params }: Params) => {
    const key = params.reference.join("/");

    let C = Cache[key];

    if (!C) {
        C = nextDynamic(() => import(`reference/${key}`));
        Cache[key] = C;
    }

    return <C />;
};

export default Page;