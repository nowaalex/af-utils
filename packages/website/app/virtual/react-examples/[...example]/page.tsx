import { ShikiTransformer, codeToHtml } from "shiki";
import theme from "shiki/dist/themes/github-light.mjs";
import ExampleHeader from "components/ExampleHeader";
import type { Metadata } from "next";

type Params = { params: { example: string[] } };

export const dynamicParams = false;

export async function generateStaticParams() {
    const glob = await import("fast-glob");

    const result = glob.default
        .sync("../../examples/src/virtual/react/**/src/code.tsx")
        .map(f => ({ example: f.split("/").slice(6, -2) }));

    return result;
}

export async function generateMetadata({ params }: Params) {
    const startCase = await import("lodash/startCase");

    const title = `${startCase.default(
        params.example.slice().reverse().join(" ")
    )} React Example`;

    const descriptionModule = await import(
        `../../../../../../examples/src/virtual/react/${params.example.join("/")}/meta.ts`
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

    const src = `/examples/src/virtual/react/${key}/index.html`;

    const { default: Description } = await import(
        `../../../../../../examples/src/virtual/react/${key}/README.md`
    );

    const { default: codeString } = await import(
        `!!raw-loader!../../../../../../examples/src/virtual/react/${key}/src/code.tsx`
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
        <div className="flex flex-col h-full">
            <div>
                <ExampleHeader />
                {Description && <Description />}
            </div>
            <div className="not-prose grid grid-cols-1 xl:grid-cols-2 flex-1 gap-4 grow xl:basis-0 xl:overflow-hidden xl:contain-strict">
                <iframe className="xl:h-full h-[40vh] w-full" src={src} />
                <Code className="overflow-x-auto xl:overflow-y-auto p-4 text-sm" />
            </div>
        </div>
    );
};

export default Page;
