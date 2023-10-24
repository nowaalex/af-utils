import { lazy } from "react";
import Example from "components/Example";
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

const Page = ({ params }: Params) => {
    const key = params.example.join("/");

    return (
        <Example
            C={{
                Example: lazy(
                    () =>
                        import(
                            `components/examples/react-examples/${key}/code.tsx`
                        )
                ),
                Code: lazy(
                    () =>
                        import(
                            `!!code-webpack-loader!components/examples/react-examples/${key}/code.tsx`
                        )
                ),
                Description: lazy(() =>
                    import(
                        `components/examples/react-examples/${key}/description.mdx`
                    ).catch(() => ({ default: () => null }))
                )
            }}
        />
    );
};

export default Page;
