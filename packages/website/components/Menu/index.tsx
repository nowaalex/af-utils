"use client";

import Link from "next/link";
import { VscGithub, VscMenu, VscClose } from "react-icons/vsc";
import { SiDiscord } from "react-icons/si";
import NavLink from "components/NavLink";
import { Fragment, MouseEventHandler } from "react";

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
    productName: string;
};

const toggleMenu = () => {
    const el = document.querySelector<HTMLInputElement>("#menu-checkbox");

    if (el) {
        el.checked = !el.checked;
    }
};

const toggleMenuWhenClickedOnLink: MouseEventHandler<HTMLElement> = e => {
    if (
        e.target instanceof HTMLAnchorElement &&
        e.target.getAttribute("href")?.startsWith("/")
    ) {
        toggleMenu();
    }
};

const Menu = ({ items, prefix, productName }: MenuProps) => (
    <>
        <input
            aria-hidden="true"
            type="checkbox"
            className="hidden ds-menu-checkbox"
            id="menu-checkbox"
        />
        <div className="ds-menu-container">
            <div className="flex gap-4 p-4 border-b sticky top-0 bg-inherit">
                <button onClick={toggleMenu} className="ds-menu-opener">
                    <VscMenu size="28px" aria-label="Open menu" />
                </button>
                <button onClick={toggleMenu} className="ds-menu-closer">
                    <VscClose size="28px" aria-label="Close menu" />
                </button>
                <nav
                    aria-label="Breadcrumb"
                    className="font-medium text-lg lg:text-xl"
                >
                    <Link href="/" className="underline">
                        af-utils
                    </Link>
                    <span className="px-2" aria-hidden="true">
                        /
                    </span>
                    <span className="text-slate-500" aria-current="page">
                        {productName}
                    </span>
                </nav>
            </div>
            <nav
                aria-label="Main navigation"
                onClick={toggleMenuWhenClickedOnLink}
                className="prose prose-sm prose-ul:list-none prose-a:no-underline ds-menu-items"
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
        </div>
    </>
);

export default Menu;
