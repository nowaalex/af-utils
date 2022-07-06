import { cx } from "@af-utils/styled";
import { VscGithub } from "react-icons/vsc";
import { SiDiscord } from "react-icons/si";
import { components } from "/AllExamples";
import NavLink from "../NavLink";
import { startCase } from "lodash";

const DOCS_STRUCTURE = [
    ["Getting started", ""],
    ["Headless", "/headless"],
    ["List", "/list"],
    ["Table", "/table"],
    ["ComplexTable", "/complexTable"],
    ["Bundle size impact", "/size"]
];

const toTree = paths => {
    const walk = (obj, arr, path) => {
        for (const k in obj) {
            arr.push({
                name: k,
                path: path + "/" + k,
                children: walk(obj[k], [], path + "/" + k)
            });
        }
        return arr;
    };

    return walk(
        paths.reduce(
            (result, path) => (
                ["examples", ...path.staticPaths].reduce(
                    (acc, v) => (acc[v] ||= {}),
                    result
                ),
                result
            ),
            {}
        ),
        [],
        ""
    );
};

const H = ["h2", "h3", "h4", "h4"];

const getHeader = (depth, path) => {
    const C = H[depth];
    return <C>{path}</C>;
};

const ExamplesSubtree = ({ node, depth = 0 }) =>
    node.children.length ? (
        <>
            {getHeader(depth, startCase(node.name))}
            <ul>
                {node.children.map(child => (
                    <li key={child.path}>
                        <ExamplesSubtree node={child} depth={depth + 1} />
                    </li>
                ))}
            </ul>
        </>
    ) : (
        <NavLink
            href={`/virtual${node.path}`}
            activeClassName="font-bold text-orange-700 translate-y-20"
        >
            {startCase(node.name)}
        </NavLink>
    );

const COMPONENTS_TREE = toTree(components)[0];

const Menu = ({ className, onClick }) => (
    <aside
        onClick={onClick}
        className={cx(
            "prose prose-sm prose-ul:list-none prose-a:no-underline max-w-full",
            className
        )}
    >
        <h2>Docs</h2>

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

        <ExamplesSubtree node={COMPONENTS_TREE} />

        <h2>Links</h2>

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
    </aside>
);

export default Menu;
