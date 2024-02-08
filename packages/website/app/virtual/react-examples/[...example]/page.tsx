import ExampleLayout from "components/Example";
import { ShikiTransformer, codeToHtml } from "shiki";
import theme from "shiki/dist/themes/github-light.mjs";
import type { Metadata } from "next";

type Params = { params: { example: string[] } };

export const dynamicParams = false;

export async function generateStaticParams() {
    const glob = await import("fast-glob");

    const result = glob.default
        .sync("../../../../../virtual/examples/react/**/src/code.tsx")
        .map(f => ({ example: f.split("/").slice(5, -2) }));

    return result;
}

export async function generateMetadata({ params }: Params) {
    const startCase = await import("lodash/startCase");

    const title = `${startCase.default(
        params.example.slice().reverse().join(" ")
    )} React Example`;

    const descriptionModule = await import(
        `../../../../../virtual/examples/react/${params.example.join("/")}/meta.ts`
    );

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

const transformers = [
    {
        pre({ children }) {
            if (children.length !== 1) {
                throw new Error("Bad children length");
            }

            const firstCodeChild = children[0];

            if (
                firstCodeChild.type === "element" &&
                firstCodeChild.tagName === "code"
            ) {
                return firstCodeChild;
            }

            throw new Error("Bad pre transformer");
        }
    }
] as ShikiTransformer[];

const Page = async ({ params }: Params) => {
    const key = params.example.join("/");

    const { default: Example } = await import(
        `../../../../../virtual/examples/react/${key}/lib/index.html`
    );

    console.log(33, Example);

    const { default: Description } = await import(
        `../../../../../virtual/examples/react/${key}/README.md`
    );

    const { default: codeString } = await import(
        `!!raw-loader!../../../../../virtual/examples/react/${key}/src/code.tsx`
    );

    const htmlString = await codeToHtml(codeString, {
        lang: "tsx",
        theme,
        transformers
    });

    const Code = ({ tabIndex = 0, ...props }: JSX.IntrinsicElements["pre"]) => (
        <pre
            {...props}
            data-theme
            tabIndex={tabIndex}
            dangerouslySetInnerHTML={{
                __html: htmlString
            }}
        />
    );

    return (
        <ExampleLayout
            C={{
                Code,
                Description
            }}
        />
    );
};

export default Page;
