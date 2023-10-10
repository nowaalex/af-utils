import { notFound, permanentRedirect } from "next/navigation";
import { lazy } from "react";

const M = require.context(
    "../../../reference",
    true,
    /reference.*\.md/,
    "lazy"
);

const K = M.keys();

export async function generateStaticParams() {
    return K.map(reference => ["reference", reference]);
}

const Cache: Record<string, any> = {};

const Page = ({ params }: { params: any }) => {
    if (params.reference.length < 2) {
        permanentRedirect("reference/index.md");
    }

    const key = "reference/" + params.reference[1];

    if (!K.includes(key)) {
        notFound();
    }

    let C = Cache[key];

    if (!C) {
        C = lazy(() => M(key));
        Cache[key] = C;
    }

    return <C />;
};

export default Page;
