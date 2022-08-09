import { useRouter } from "next/router";
import Head from "next/head";

const CommonHead = ({ title, description }) => {
    const { asPath } = useRouter();
    const prefixedTitle = title
        ? `${title} | ${process.env.NEXT_PUBLIC_TITLE_PREFIX}`
        : process.env.NEXT_PUBLIC_TITLE_PREFIX;

    return (
        <Head>
            <title>{prefixedTitle}</title>
            <meta property="og:type" content="website" />
            <meta property="og:title" content={prefixedTitle} />
            <meta
                property="og:url"
                content={process.env.NEXT_PUBLIC_ORIGIN + asPath}
            />
            {description ? (
                <>
                    <meta name="description" content={description} />
                    <meta property="og:description" content={description} />
                </>
            ) : null}
        </Head>
    );
};

export default CommonHead;
