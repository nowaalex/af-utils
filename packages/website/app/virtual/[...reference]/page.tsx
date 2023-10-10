import { notFound, permanentRedirect } from "next/navigation";
import { lazy } from "react";

const map = process.env.VIRTUAL_REFERENCE_MAP as unknown as Record<
    string,
    boolean
>;

export function generateStaticParams() {
    const result = Object.keys(map).map(reference => ["reference", reference]);

    // console.log({ result });

    return result;
}

const Cache: Record<string, any> = {};

const Page = ({ params }: { params: any }) => {
    if (params.reference.length < 2) {
        permanentRedirect("/virtual/reference/index.md");
    }

    const key = params.reference[1];

    if (!map[key]) {
        notFound();
    }

    let C = Cache[key];

    if (!C) {
        C = lazy(() => import(`../../../reference/${key}`));
        Cache[key] = C;
    }

    return <C />;
};

export default Page;
