/* eslint-disable react/jsx-no-target-blank */

import Link from "next/link";

const AutoLink = ({ href, ...props }: any) => {
    if (href) {
        if (href.startsWith("/") || href.startsWith("#")) {
            return <Link href={href} {...props} />;
        }
    }

    return <a href={href} target="_blank" rel="noopener" {...props} />;
};

export default AutoLink;
