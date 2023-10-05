import Link from "next/link";
import { cx } from "@af-utils/styled";
import { usePathname } from "next/navigation";
import { ComponentPropsWithoutRef } from "react";

type NavLinkProps = ComponentPropsWithoutRef<typeof Link> & {
    activeClassName: string;
    href: string;
};

const NavLink = ({
    href,
    className,
    activeClassName,
    ...props
}: NavLinkProps) => {
    const pathname = usePathname();
    const isActive =
        href === "/virtual" ? pathname === href : pathname.startsWith(href);

    return (
        <Link
            {...props}
            href={href}
            className={cx(className || "", isActive ? activeClassName : "")}
        />
    );
};

export default NavLink;
