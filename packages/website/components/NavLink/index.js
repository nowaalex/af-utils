import { useRouter } from "next/router";
import Link from "next/link";
import { cx } from "@af-utils/styled";

const NavLink = ({ href, children, className, activeClassName, ...props }) => {
    const { asPath } = useRouter();
    const isActive = asPath === href;

    return (
        <Link href={href}>
            <a
                className={cx(className, isActive ? activeClassName : "")}
                {...props}
            >
                {children}
            </a>
        </Link>
    );
};

export default NavLink;
