import { useRouter } from "next/router";
import Head from "next/head";

const CommonHead = ({ title }) => {
    const { asPath } = useRouter();
    const prefixedTitle = `${title} | ${process.env.NEXT_PUBLIC_TITLE_PREFIX}`;

    return (
        <Head>
            <title>{prefixedTitle}</title>
            <meta property="og:type" content="website" />
            <meta property="og:title" content={prefixedTitle} />
            <meta
                property="og:url"
                content={process.env.NEXT_PUBLIC_ORIGIN + asPath}
            />
        </Head>
    );
};

export default CommonHead;
