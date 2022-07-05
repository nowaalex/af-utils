import { useRouter } from "next/router";
import CommonHead from "/components/CommonHead";
import VirtualLayout from "/components/layouts/Virtual";
import { table, components } from "/AllExamples";
import urlToTitle from "/utils/urlToTitle";
import { Suspense } from "react";

const Example = () => {
    const { asPath } = useRouter();
    const { ComponentCode, Component } = table[asPath];
    const title = urlToTitle(asPath);

    return (
        <VirtualLayout>
            <CommonHead title={`examples | ${title}`} />
            <div className="min-h-0 flex flex-col flex-auto prose max-w-full p-4 lg:px-6 lg:pb-6 xl:px-8 xl:pb-8 md:h-screen">
                <h1 className="text-xl md:text-2xl lg:text-3xl">{title}</h1>
                <Suspense fallback="Loading example...">
                    <div className="flex-auto min-h-0 grid gap-4 lg:gap-6 xl:gap-8 place-content-start grid-cols-1 lg:grid-cols-[minmax(10em,_40%),_1fr]">
                        <div className="shadow-lg min-h-0 overflow-hidden prose-table:m-0 prose-table:p-0">
                            <Component />
                        </div>
                        <pre className="language-jsx overflow-auto !m-0 shadow-lg">
                            <ComponentCode />
                        </pre>
                    </div>
                </Suspense>
            </div>
        </VirtualLayout>
    );
};

export const getStaticProps = context => ({
    props: {},
    notFound: !table[`/virtual/examples/${context.params.example.join("/")}`]
});

export const getStaticPaths = async () => ({
    paths: components.map(route => ({
        params: {
            example: route.replace(/^\/virtual\/examples\//, "").split("/")
        }
    })),
    fallback: false
});

export default Example;
