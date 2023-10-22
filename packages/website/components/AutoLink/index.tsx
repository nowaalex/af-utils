import Link from "next/link";
import { ComponentPropsWithoutRef } from "react";

type AutoLinkProps = ComponentPropsWithoutRef<typeof Link>;

const AutoLink = ({ href, prefetch = true, ...props }: AutoLinkProps) => {
    let normalizedHref = href;

    if (href && typeof href === "string") {
        normalizedHref = href.replace(
            process.env.NEXT_PUBLIC_ORIGIN as string,
            ""
        );

        if (normalizedHref.startsWith("https://")) {
            return (
                <a
                    href={normalizedHref}
                    target="_blank"
                    rel="noopener"
                    {...props}
                />
            );
        }
    } else {
        normalizedHref = href;
    }

    return <Link href={normalizedHref} prefetch={prefetch} {...props} />;
};

export default AutoLink;
