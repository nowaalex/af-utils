import cx from "utils/cx";
import { VscGithub } from "react-icons/vsc";
import { SiDiscord } from "react-icons/si";
import NavLink from "components/NavLink";
import { Fragment } from "react";

export type MenuItem = {
    name: string;
    path: string;
    exact?: boolean;
    children?: readonly MenuItem[] | MenuItem[];
};

const H = ["h2", "h3", "h4", "h4"] as const;

const getHeader = (depth: number, path: string) => {
    const C = H[depth];
    return <C>{path}</C>;
};

const renderSubtree = (node: MenuItem, prefix: string, depth: number) =>
    node.children?.length ? (
        <Fragment key={node.path}>
            {getHeader(depth, node.name)}
            <ul>
                {node.children.map(child => (
                    <li key={child.path}>
                        {renderSubtree(child, prefix, depth + 1)}
                    </li>
                ))}
            </ul>
        </Fragment>
    ) : (
        <NavLink
            key={node.path}
            exact={node.exact}
            href={prefix + node.path}
            className="font-normal"
            activeClassName="!font-semibold text-orange-700 translate-y-20"
        >
            {node.name}
        </NavLink>
    );

type MenuProps = JSX.IntrinsicElements["nav"] & {
    items: readonly MenuItem[] | MenuItem[];
    prefix: string;
};

const Menu = ({ className, items, prefix, ...props }: MenuProps) => (
    <nav
        {...props}
        aria-label="Main navigation"
        className={cx(
            "prose prose-sm prose-ul:list-none prose-a:no-underline p-4",
            className
        )}
    >
        {items.map(node => renderSubtree(node, prefix, 0))}

        <h2>Links</h2>

        <ul>
            <li>
                <a
                    href="https://github.com/nowaalex/af-utils/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                >
                    <VscGithub size="1.2em" aria-hidden="true" />
                    Github
                </a>
            </li>
            <li>
                <a
                    href="https://discord.gg/6uQZB2y4cz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                >
                    <SiDiscord size="1.2em" aria-hidden="true" />
                    Discord
                </a>
            </li>
        </ul>
    </nav>
);

export default Menu;
