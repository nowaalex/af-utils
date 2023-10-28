import ExampleLayout from "components/Example";
import type { Metadata } from "next";

type Params = { params: { example: string[] } };

export const dynamicParams = false;

export async function generateStaticParams() {
    const glob = await import("fast-glob");

    const result = glob.default
        .sync("components/examples/react-examples/**/code.tsx")
        .map(f => ({ example: f.split("/").slice(3, -1) }));

    return result;
}

export async function generateMetadata({ params }: Params) {
    const startCase = await import("lodash/startCase");

    const title = `${startCase.default(
        params.example.slice().reverse().join(" ")
    )} React Example`;

    const descriptionModule = await import(
        `components/examples/react-examples/${params.example.join("/")}/meta.ts`
    ).catch(() => ({ default: null }));

    const description = descriptionModule?.default?.description;

    return {
        title,
        description,
        openGraph: {
            title,
            description
        }
    } satisfies Metadata;
}

const Page = async ({ params }: Params) => {
    const key = params.example.join("/");

    const { default: meta } = await import(
        `components/examples/react-examples/${key}/meta.ts`
    ).catch(() => ({ default: null }));

    const { default: Example } = await import(
        `components/examples/react-examples/${key}/code.tsx`
    );

    const { default: Code } = await import(
        `!!code-webpack-loader!components/examples/react-examples/${key}/code.tsx`
    );

    const { default: Description } = await import(
        `components/examples/react-examples/${key}/description.mdx`
    ).catch(() => ({ default: null }));

    return (
        <ExampleLayout
            iframe={!!meta?.iframe}
            C={{
                Example,
                Code,
                Description
            }}
        />
    );
};

export default Page;
