import { cx } from "@emotion/css";
import { VscGithub } from "react-icons/vsc";
import { SiDiscord } from "react-icons/si";
import NavLink from "components/NavLink";
import startCase from "lodash/startCase";
import { useMemo } from "react";

const DOCS_STRUCTURE = [
    ["Getting started", ""],
    ["FAQ", "/faq"],
    ["Reference", "/reference"],
    ["Bundle size impact", "/size"]
] as const;

type Node = {
    name: string;
    path: string;
    children: Node[];
};

const walk = (obj: Record<string, any>, arr: Node[], path: string) => {
    for (const k in obj) {
        const newPath = `${path}/${k}`;
        arr.push({
            name: k,
            path: newPath,
            children: walk(obj[k], [], newPath)
        });
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
            className="font-normal"
            activeClassName="!font-semibold text-orange-700 translate-y-20"
        >
            {startCase(node.name)}
        </NavLink>
    );

type MenuProps = JSX.IntrinsicElements["nav"] & {
    map: object;
};

const Menu = ({ className, map, ...props }: MenuProps) => {
    const COMPONENTS_TREE = useMemo(
        () => ({
            name: "React examples",
            children: walk(map, [], "/react-examples"),
            path: ""
        }),
        [map]
    );

    return (
        <nav
            {...props}
            className={cx(
                "prose prose-sm prose-ul:list-none prose-a:no-underline",
                className
            )}
        >
            <h2>Description</h2>

            <ul>
                {DOCS_STRUCTURE.map(([label, url]) => (
                    <li key={url}>
                        <NavLink
                            href={`/virtual${url}`}
                            className="font-normal"
                            activeClassName="!font-semibold text-orange-700 translate-y-20"
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
};

export default Menu;
