import type { ExampleFile } from "utils/examples";

export interface ExampleFileTreeFile extends ExampleFile {
    kind: "file";
    name: string;
    path: string;
}

export interface ExampleFileTreeFolder {
    children: ExampleFileTreeNode[];
    kind: "folder";
    name: string;
    path: string;
}

export type ExampleFileTreeNode = ExampleFileTreeFile | ExampleFileTreeFolder;

function sortTree(nodes: ExampleFileTreeNode[]): ExampleFileTreeNode[] {
    for (const node of nodes) {
        if (node.kind === "folder") sortTree(node.children);
    }

    return nodes.toSorted((a, b) => {
        if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
}

export function buildExampleFileTree(
    files: readonly ExampleFile[]
): ExampleFileTreeNode[] {
    const root: ExampleFileTreeNode[] = [];

    for (const file of files) {
        const segments = file.name.split("/");
        let children = root;

        for (const [index, name] of segments.entries()) {
            const path = segments.slice(0, index + 1).join("/");

            if (index === segments.length - 1) {
                children.push({ ...file, kind: "file", name, path: file.name });
                continue;
            }

            let folder = children.find(
                (node): node is ExampleFileTreeFolder =>
                    node.kind === "folder" && node.name === name
            );
            if (!folder) {
                folder = { children: [], kind: "folder", name, path };
                children.push(folder);
            }
            children = folder.children;
        }
    }

    return sortTree(root);
}
