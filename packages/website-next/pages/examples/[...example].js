import { useRouter } from "next/router";
import Head from "next/head";
import { table, components } from "/AllExamples";
import humanizeRoute from "/utils/humanizeRoute";

const Example = () => {

    const { asPath } = useRouter();
    const { ComponentCode, Component } = table[ asPath ];
    const humanizedRoute = humanizeRoute(asPath);

    return (
        <div className="grow shrink grid grid-cols-1 lg:grid-cols-[minmax(min-content,_35%),_1fr] gap-2">
            <Head>
                <title>af-virtual-scroll | {humanizedRoute}</title>
            </Head>
            <h1 className="text-4xl lg:col-span-2 mt-1 font-bold text-center ml-14 sm:ml-0">{humanizedRoute}</h1>
            <Component />
            <ComponentCode className="overflow-auto text-sm" />
        </div>
    );
}

export const getStaticProps = context => ({
    props: {},
    notFound: !table[ `/examples/${context.params.example.join("/")}` ]
});

export const getStaticPaths = async () => ({
    paths: components.map( route => ({
        params: { example: route.replace( /^\/examples\//, "" ).split( "/" ) }
    })),
    fallback: false
});

export default Example;