import { useRouter } from "next/router";
import CommonHead from "/components/CommonHead";
import { table, components } from "/AllExamples";
import urlToTitle from "/utils/urlToTitle";
import { Suspense } from "react";

const Example = () => {
    const { asPath } = useRouter();
    const { ComponentCode, Component } = table[asPath];
    const title = urlToTitle(asPath);

    return (
        <div className="grow shrink grid place-content-start grid-cols-1 lg:grid-cols-[minmax(10em,_40%),_1fr]">
            <CommonHead title={`examples | ${title}`} />
            <h1 className="text-4xl lg:col-span-2 mt-1 mb-2 font-bold text-center ml-14 sm:ml-0">
                {title}
            </h1>
            <Suspense fallback="Loading component...">
                <Component />
            </Suspense>

            <pre className="text-sm language-jsx overflow-auto !m-0">
                <Suspense fallback="Loading code...">
                    <ComponentCode />
                </Suspense>
            </pre>
        </div>
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
