"use client";

import Link from "next/link";
import cx from "utils/cx";
import { usePathname } from "next/navigation";
import { ComponentPropsWithoutRef } from "react";

type NavLinkProps = ComponentPropsWithoutRef<typeof Link> & {
    activeClassName: string;
    exact?: boolean;
    compareHref?: ComponentPropsWithoutRef<typeof Link>["href"];
};

const NavLink = ({
    href,
    compareHref = href,
    exact,
    className,
    activeClassName,
    ...props
}: NavLinkProps) => {
    const pathname = usePathname();

    const isActive = exact
        ? pathname === compareHref
        : typeof compareHref === "string" && pathname.startsWith(compareHref);

    return (
        <Link
            {...props}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cx(className, isActive ? activeClassName : "")}
        />
    );
};

export default NavLink;
