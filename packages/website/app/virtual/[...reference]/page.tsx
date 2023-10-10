import { notFound, permanentRedirect } from "next/navigation";
import nextDynamic from "next/dynamic";
import type { Metadata, ResolvingMetadata } from "next";
import startCase from "utils/startCase";

const map = process.env.VIRTUAL_REFERENCE_MAP as unknown as Record<
    string,
    boolean
>;

export const dynamic = "force-dynamic";

export function generateStaticParams() {
    const result = Object.keys(map).map(reference => [{ reference }]);

    return result;
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
    return params.reference.length > 1
        ? {
              title: `${startCase(
                  params.reference[1].replace(".md", "").replace(".", " | ")
              )} | Reference`
          }
        : {};
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
        C = nextDynamic(() => import(`../../../reference/${key}`));
        Cache[key] = C;
    }

    return <C />;
};

export default Page;
