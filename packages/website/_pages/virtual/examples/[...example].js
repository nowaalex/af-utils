import { Suspense } from "react";
import CommonHead from "/components/CommonHead";
import VirtualLayout from "/components/layouts/Virtual";
import { table, components } from "/AllExamples";

const Example = ({ name }) => {
    const { Code, Component, Description, meta, title } = table[name];

    return (
        <>
            <CommonHead
                lib="virtual"
                title={`examples | ${title}`}
                description={meta?.description}
            />
            <div className="min-h-0 basis-0 flex flex-col flex-auto prose max-w-full p-4 lg:px-6 lg:pb-6 xl:px-8 xl:pb-8 md:h-screen">
                <h1 className="text-xl md:text-2xl lg:text-3xl">{title}</h1>
                <Suspense fallback="Loading example...">
                    {Description ? (
                        <div className="prose mb-4 max-w-[1200px]">
                            <Description />
                        </div>
                    ) : null}
                    <div className="flex-auto min-h-0 grid gap-4 grid-cols-1 xl:grid-flow-col xl:grid-cols-[minmax(400px,_2fr),_minmax(0,_3fr)] lg:gap-6 xl:gap-8">
                        <div className="shadow-lg min-h-0 h-full prose-table:m-0 prose-table:p-0 overflow-hidden contain-strict">
                            <Component />
                        </div>
                        <Code className="!rounded-none overflow-scroll !m-0 shadow-lg contain-strict" />
                    </div>
                </Suspense>
            </div>
        </>
    );
};

Example.getLayout = page => <VirtualLayout>{page}</VirtualLayout>;

export const getStaticProps = context => {
    const name = context.params.example.join("/");
    return {
        props: {
            name
        },
        notFound: !table[name]
    };
};

export const getStaticPaths = async () => ({
    paths: components.map(route => ({
        params: {
            example: route.staticPaths
        }
    })),
    fallback: false
});

export default Example;
