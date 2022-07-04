import { useState } from "react";
import { cx } from "@af-utils/styled";
import { VscGithub } from "react-icons/vsc";
import { VscMenu } from "react-icons/vsc";
import { SiDiscord } from "react-icons/si";
import { components } from "/AllExamples";
import NavLink from "../NavLink";
import urlToTitle from "/utils/urlToTitle";

const DOCS_STRUCTURE = [
    ["Getting started", "/virtual"],
    ["Headless", "/virtual/headless"],
    ["List", "/virtual/list"],
    ["Table", "/virtual/table"],
    ["ComplexTable", "/virtual/complexTable"],
    ["Bundle size impact", "/virtual/size"]
];

const Menu = ({ className }) => {
    const [opened, setOpened] = useState(true);

    return (
        <>
            <button
                className="outline-none fixed top-1 left-3 z-20 block md:hidden"
                onClick={() => setOpened(!opened)}
            >
                <VscMenu className="h-8 w-8" />
            </button>

            <aside
                onClick={() => setOpened(false)}
                className={cx(
                    "z-10 overflow-auto grow-0 shrink-0 pt-8 bg-neutral-100 fixed inset-0 md:h-screen md:block md:pt-0 md:static",
                    opened || "hidden",
                    className
                )}
            >
                <h2 className="text-xl font-bold pl-3 mt-3">Docs</h2>

                <nav className="flex flex-col">
                    {DOCS_STRUCTURE.map(([label, url]) => (
                        <NavLink
                            key={url}
                            href={url}
                            activeClassName="bg-neutral-300"
                            className="px-6 py-1"
                        >
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <h2 className="text-xl font-bold pl-3 mt-6">Examples</h2>

                <nav className="flex flex-col">
                    {components.map(item => (
                        <NavLink
                            href={item}
                            key={item}
                            activeClassName="bg-neutral-300"
                            className="px-6 py-1"
                        >
                            {urlToTitle(item)}
                        </NavLink>
                    ))}
                </nav>

                <h2 className="text-xl font-bold pl-3 mt-3">Links</h2>

                <div className="flex flex-col mt-2 ml-6">
                    <a
                        href="https://github.com/nowaalex/af-virtual-scroll"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center py-1"
                    >
                        <VscGithub className="mr-2 self-stretch w-auto h-auto" />
                        Github
                    </a>
                    <a
                        href="https://discord.gg/6uQZB2y4cz"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center py-1"
                    >
                        <SiDiscord className="mr-2 self-stretch w-auto h-auto" />
                        Discord
                    </a>
                </div>
            </aside>
        </>
    );
};

export default Menu;
