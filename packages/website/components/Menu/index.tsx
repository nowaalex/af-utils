// @ts-ignore
import { cx } from "@af-utils/styled";
import { VscGithub } from "react-icons/vsc";
import { SiDiscord } from "react-icons/si";
import NavLink from "../NavLink";
import startCase from "utils/startCase";

const DOCS_STRUCTURE = [
    ["Getting started", ""],
    ["FAQ", "/faq"],
    ["Headless", "/headless"],
    ["List", "/list"],
    ["Table", "/table"],
    ["ComplexTable", "/complexTable"],
    ["Bundle size impact", "/size"]
];

type Node = {
    name: string;
    path: string;
    children: Node[];
};

const walk = (obj: Record<string, {}>, arr: any[], path: string) => {
    for (const k in obj) {
        const newPath = `${path}/${k}`;
        arr.push({
            name: k,
            path: newPath,
            children: walk(obj[k], [], newPath)
        } as Node);
    }
    return arr;
};

const H = ["h2", "h3", "h4", "h4"] as const;

const getHeader = (depth: number, path: string) => {
    const C = H[depth];
    return <C>{path}</C>;
};

const ExamplesSubtree = ({ node, depth }: { node: Node; depth: number }) =>
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

const COMPONENTS_TREE = {
    name: "examples",
    children: walk(
        process.env.VIRTUAL_EXAMPLE_ROUTES_MAP as any,
        [],
        "/examples"
    ),
    path: ""
};

const Menu = ({ className, onClick }: JSX.IntrinsicElements["aside"]) => (
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

        <ExamplesSubtree node={COMPONENTS_TREE} depth={0} />

        <h2>Links</h2>

        <ul>
            <li>
                <a
                    href="https://github.com/nowaalex/af-utils"
                    target="_blank"
                    rel="noopener noreferrer"
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
                    rel="noopener noreferrer"
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
