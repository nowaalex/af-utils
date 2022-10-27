import { useRouter } from "next/router";
import Link from "next/link";
import { cx } from "@af-utils/styled";

const NavLink = ({ href, className, activeClassName, ...props }) => {
    const { asPath } = useRouter();
    const isActive = asPath === href;

    return (
        <Link
            href={href}
            className={cx(className || "", isActive ? activeClassName : "")}
            {...props}
        />
    );
};

export default NavLink;
