import Link from "next/link";

const AutoLink = ({ href, ...props }) => {
    if (href) {
        if (href.startsWith("/") || href.startsWith("#")) {
            return (
                <Link href={href}>
                    <a {...props} />
                </Link>
            );
        }
    }

    return <a href={href} target="_blank" rel="noreferrer" {...props} />;
};

export default AutoLink;
