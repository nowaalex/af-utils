import { cx } from "@af-utils/styled";
import { VscGithub } from "react-icons/vsc";
import { SiDiscord } from "react-icons/si";
import { components } from "/AllExamples";
import NavLink from "../NavLink";
import urlToTitle from "/utils/urlToTitle";

const DOCS_STRUCTURE = [
    ["Getting started", "/"],
    ["Headless", "/headless"],
    ["List", "/list"],
    ["Table", "/table"],
    ["ComplexTable", "/complexTable"],
    ["Bundle size impact", "/size"]
];

const Menu = ({ className, onClick }) => (
    <aside
        onClick={onClick}
        className={cx(
            "prose prose-ul:list-none prose-a:no-underline max-w-full",
            className
        )}
    >
        <h2>Docs</h2>

        <nav>
            <ul>
                {DOCS_STRUCTURE.map(([label, url]) => (
                    <li key={url}>
                        <NavLink
                            href={`/virtual${url}`}
                            activeClassName="font-bold text-orange-700 translate-y-20"
                        >
                            {label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>

        <h2>Examples</h2>

        <nav>
            <ul>
                {components.map(item => (
                    <li key={item}>
                        <NavLink
                            href={item}
                            activeClassName="font-bold text-orange-700"
                        >
                            {urlToTitle(item)}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>

        <h2>Links</h2>

        <nav>
            <ul>
                <li>
                    <a
                        href="https://github.com/nowaalex/af-utils"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2"
                    >
                        <VscGithub size="1.2em" />
                        Github
                    </a>
                </li>
                <li>
                    <a
                        href="https://discord.gg/6uQZB2y4cz"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2"
                    >
                        <SiDiscord size="1.2em" />
                        Discord
                    </a>
                </li>
            </ul>
        </nav>
    </aside>
);

export default Menu;
