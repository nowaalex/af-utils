import Link from "next/link";
import { ComponentPropsWithoutRef } from "react";

type AutoLinkProps = ComponentPropsWithoutRef<typeof Link>;

const AutoLink = ({ href, prefetch = true, ...props }: AutoLinkProps) => {
    if (href && typeof href === "string" && /^https?:\//.test(href)) {
        return <a href={href} target="_blank" rel="noopener" {...props} />;
    }

    return <Link href={href} prefetch={prefetch} {...props} />;
};

export default AutoLink;
