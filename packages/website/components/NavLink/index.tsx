"use client";

import Link from "next/link";
import { cx } from "@emotion/css";
import { usePathname } from "next/navigation";
import { ComponentPropsWithoutRef } from "react";

type NavLinkProps<T> = ComponentPropsWithoutRef<typeof Link> & {
    activeClassName: string;
};

const NavLink = <T,>({
    href,
    className,
    activeClassName,
    prefetch = true,
    ...props
}: NavLinkProps<T>) => {
    const pathname = usePathname();
    const isActive =
        href === "/virtual"
            ? pathname === href
            : typeof href === "string" && pathname.startsWith(href);

    return (
        <Link
            {...props}
            prefetch={prefetch}
            href={href}
            className={cx(className || "", isActive ? activeClassName : "")}
        />
    );
};

export default NavLink;
