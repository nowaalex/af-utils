import Link from "next/link";

const AutoLink = ({ href, ...props }: any) => {
    /* if (href) {
        if (!/^https?:\//.test(href)) {
            return <Link href={href} {...props} />;
        }
    }*/

    return <a href={href} target="_blank" rel="noopener" {...props} />;
};

export default AutoLink;
