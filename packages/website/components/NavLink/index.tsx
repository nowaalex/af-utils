"use client";

import Link from "next/link";
import { cx } from "@emotion/css";
import { usePathname } from "next/navigation";
import { ComponentPropsWithoutRef } from "react";

type NavLinkProps = ComponentPropsWithoutRef<typeof Link> & {
    activeClassName: string;
    exact?: boolean;
};

const NavLink = ({
    href,
    exact,
    className,
    activeClassName,
    ...props
}: NavLinkProps) => {
    const pathname = usePathname();

    const isActive = exact
        ? pathname === href
        : typeof href === "string" && pathname.startsWith(href);

    return (
        <Link
            {...props}
            href={href}
            className={cx(className || "", isActive ? activeClassName : "")}
        />
    );
};

export default NavLink;
