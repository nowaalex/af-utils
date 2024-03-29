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

        try {
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
                <div className="flex h-full flex-col">
                    <div>
                        <ExampleHeader />
                        <Description />
                    </div>
                    <div className="not-prose xl:contain-strict grid flex-1 grow grid-cols-1 gap-4 xl:basis-0 xl:grid-cols-2 xl:overflow-hidden">
                        <iframe
                            className="h-[35vh] w-full xl:h-full"
                            src={`/examples/src/${exampleHref}/${key}/index.html`}
                        />
                        <pre
                            className="overflow-x-auto p-4 text-sm xl:overflow-y-auto"
                            data-theme
                            tabIndex={0}
                            dangerouslySetInnerHTML={{
                                __html: htmlString
                            }}
                        />
                    </div>
                </div>
            );
        } catch (e) {
            return (
                <>
                    <h1>This {exampleHref} example is missing</h1>
                    <p>Check your url or choose another example in the menu.</p>
                </>
            );
        }
    };

export default getExamplePage;
