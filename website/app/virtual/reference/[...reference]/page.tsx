import type { Metadata } from "next";
import glob from "fast-glob";
import Link from "next/link";

interface Params {
    params: { reference: string[] };
}

export async function generateStaticParams() {
    const result = glob
        .sync("reference/*.md")
        .map(f => ({ reference: f.split("/").slice(1) }));

    return result;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const startCase = await import("lodash/startCase");

    const title = `${params.reference
        .join("")
        .replace(".md", "")
        .split(".")
        .map(startCase.default)
        .join(" | ")} | Reference`;

    return {
        title,
        openGraph: {
            title
        }
    } satisfies Metadata;
}

const Page = async ({ params }: Params) => {
    const key = params.reference.join("/");

    try {
        const { default: C } = await import(`reference/${key}`);

        return <C />;
    } catch (e) {
        return (
            <>
                <h1>This virtual reference page is missing</h1>
                <p>Some helpful links:</p>
                <ul>
                    <li>
                        <Link href="/virtual/reference/index.md">
                            virtual reference home
                        </Link>
                    </li>
                    <li>
                        <Link href="/virtual/reference/virtual-core.md">
                            vitual core reference
                        </Link>
                    </li>
                    <li>
                        <Link href="/virtual/reference/virtual-react.md">
                            vitual react reference
                        </Link>
                    </li>
                </ul>
            </>
        );
    }
};

export default Page;
