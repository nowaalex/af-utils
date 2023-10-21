import Example from "components/Example";
import dynamic from "next/dynamic";
import startCase from "lodash/startCase";
import type { Metadata } from "next";
import type { ComponentProps } from "react";

type Params = { params: { example: string[] } };

export const dynamicParams = false;

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

const Cache: Record<string, ComponentProps<typeof Example>["C"]> = {};

const Page = ({ params }: Params) => {
    const key = params.example.join("/");

    const C = (Cache[key] ||= {
        Example: dynamic(
            () => import(`components/examples/react-examples/${key}/code.tsx`)
        ),
        Code: dynamic(
            () =>
                import(
                    `!!code-webpack-loader!components/examples/react-examples/${key}/code.tsx`
                )
        ),
        Description: dynamic(() =>
            import(
                `components/examples/react-examples/${key}/description.mdx`
            ).catch(() => () => null)
        )
    });

    return <Example C={C} />;
};

export default Page;
