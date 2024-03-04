"use client";

import { MenuItem } from "components/Menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GrLinkNext, GrLinkPrevious } from "react-icons/gr";

const NextPrevBlock = ({ items }: { items: MenuItem[] }) => {
    const pathname = usePathname();

    const idx = items.findIndex(item => item.path === pathname);

    return (
        <>
            {idx > 0 ? (
                <Link
                    href={items[idx - 1].path}
                    aria-label={`Previous: ${items[idx - 1].name}`}
                    className="flex items-center gap-1 text-ellipsis break-words text-left"
                >
                    <GrLinkPrevious />
                    {items[idx - 1].name}
                </Link>
            ) : (
                <div />
            )}
            {idx < items.length - 1 ? (
                <Link
                    href={items[idx + 1].path}
                    aria-label={`Next: ${items[idx + 1].name}`}
                    className="flex items-center gap-1 text-ellipsis break-words text-right"
                >
                    {items[idx + 1].name}
                    <GrLinkNext />
                </Link>
            ) : (
                <div />
            )}
        </>
    );
};

export default NextPrevBlock;
