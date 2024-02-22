"use server";

import { ShikiTransformer, codeToHtml } from "shiki";
import theme from "shiki/dist/themes/github-light.mjs";
import ExampleHeader from "components/ExampleHeader";
import type { Params } from "utils/examples";

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

const getExamplePage = (exampleHref: string) =>
    async function ({ params }: Params) {
        const key = params.example.join("/");

        const { default: Description } = await import(
            `@af-utils/examples/src/${exampleHref}/${key}/README.md`
        );

        const { default: codeString } = await import(
            `!!raw-loader!@af-utils/examples/src/${exampleHref}/${key}/src/code.tsx`
        );

        const htmlString = await codeToHtml(codeString, {
            lang: "tsx",
            theme,
            transformers
        });

        return (
            <div className="flex flex-col h-full">
                <div>
                    <ExampleHeader />
                    <Description />
                </div>
                <div className="not-prose grid grid-cols-1 xl:grid-cols-2 flex-1 gap-4 grow xl:basis-0 xl:overflow-hidden xl:contain-strict">
                    <iframe
                        className="xl:h-full h-[35vh] w-full"
                        src={`/examples/src/${exampleHref}/${key}/index.html`}
                    />
                    <pre
                        className="overflow-x-auto xl:overflow-y-auto p-4 text-sm"
                        data-theme
                        tabIndex={0}
                        dangerouslySetInnerHTML={{
                            __html: htmlString
                        }}
                    />
                </div>
            </div>
        );
    };

export default getExamplePage;
