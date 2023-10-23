import { Suspense, lazy } from "react";
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
    const startCase = await import("lodash/startCase");

    return {
        title: `${params.reference
            .join("")
            .replace(".md", "")
            .split(".")
            .map(startCase.default)
            .join(" | ")} | Reference`
    };
}

const Page = ({ params }: Params) => {
    const key = params.reference.join("/");

    const C = lazy(() => import(`reference/${key}`));

    return (
        <Suspense fallback="Loading virtual reference...">
            <C />
        </Suspense>
    );
};

export default Page;
