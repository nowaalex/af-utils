import { useRouter } from "next/router";
import Head from "next/head";
import { ORIGIN, TITLE_PREFIX } from "/constants";

const CommonHead = ({ title }) => {
    const { asPath } = useRouter();
    const prefixedTitle = `${title} | ${TITLE_PREFIX}`;

    return (
        <Head>
            <title>{prefixedTitle}</title>
            <meta property="og:type" content="website" />
            <meta property="og:title" content={prefixedTitle} />
            <meta property="og:url" content={ORIGIN + asPath} />
        </Head>
    );
};

export default CommonHead;
