import { useRouter } from "next/router";
import Head from "next/head";
import { table, components } from "/AllExamples";
import humanizeRoute from "/utils/humanizeRoute";

const Example = () => {

    const { asPath } = useRouter();
    const { ComponentCode, Component } = table[ asPath ];
    const humanizedRoute = humanizeRoute(asPath);

    return (
        <div className="grow shrink grid grid-cols-1 lg:grid-cols-[minmax(10em,_40%),_1fr]">
            <Head>
                <title>af-virtual-scroll | {humanizedRoute}</title>
            </Head>
            <h1 className="text-4xl lg:col-span-2 mt-1 mb-2 font-bold text-center ml-14 sm:ml-0">{humanizedRoute}</h1>
            <Component />
            <pre className="overflow-auto !m-0">
                <ComponentCode />
            </pre>
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