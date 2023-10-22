import Example from "components/Example";
import nextDynamic from "next/dynamic";
import startCase from "lodash/startCase";
import type { Metadata } from "next";

type Params = { params: { example: string[] } };

export const dynamic = "error";

export async function generateStaticParams() {
    const glob = await import("fast-glob");

    const result = glob.default
        .sync("components/examples/react-examples/**/code.tsx")
        .map(f => ({ example: f.split("/").slice(3, -1) }));

    return result;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    return {
        title: `${startCase(
            params.example.slice(0).reverse().join(" ")
        )} React Example`
    };
}

const Page = ({ params }: Params) => {
    const key = params.example.join("/");

    return (
        <Example
            C={{
                Example: nextDynamic(
                    () =>
                        import(
                            `components/examples/react-examples/${key}/code.tsx`
                        )
                ),
                Code: nextDynamic(
                    () =>
                        import(
                            `!!code-webpack-loader!components/examples/react-examples/${key}/code.tsx`
                        )
                ),
                Description: nextDynamic(() =>
                    import(
                        `components/examples/react-examples/${key}/description.mdx`
                    ).catch(() => () => null)
                )
            }}
        />
    );
};

export default Page;
