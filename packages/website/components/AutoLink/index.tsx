import Link from "next/link";
import { ComponentPropsWithoutRef } from "react";

type AutoLinkProps = ComponentPropsWithoutRef<typeof Link> & {
    href: string;
};

const AutoLink = ({ href, prefetch = true, ...props }: AutoLinkProps) => {
    if (href) {
        if (!/^https?:\//.test(href)) {
            return <Link href={href} prefetch={prefetch} {...props} />;
        }
    }

    return <a href={href} target="_blank" rel="noopener" {...props} />;
};

export default AutoLink;
