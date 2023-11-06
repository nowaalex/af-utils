import ExampleLayout from "components/Example";
import shiki from "shiki";
import theme from "shiki/themes/github-light.json";
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

const Page = async ({ params }: Params) => {
    const key = params.example.join("/");

    const { default: meta } = await import(
        `components/examples/react-examples/${key}/meta.ts`
    );

    const { default: Example } = await import(
        `components/examples/react-examples/${key}/code.tsx`
    );

    const { default: Description } = await import(
        `components/examples/react-examples/${key}/description.mdx`
    );

    const { default: codeString } = await import(
        `!!raw-loader!components/examples/react-examples/${key}/code.tsx`
    );

    const highlighter = await shiki.getHighlighter({
        theme: theme.name
    });

    const tokens = highlighter.codeToThemedTokens(codeString, "tsx");

    const htmlString = shiki.renderToHtml(tokens, {
        elements: {
            pre({ children }) {
                return children;
            }
        }
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
