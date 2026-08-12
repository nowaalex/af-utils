import { chmod, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const examplesRoot = resolve(repositoryRoot, "examples");
const structure = JSON.parse(
    await readFile(resolve(examplesRoot, "structure.json"), "utf8")
);
const sourceRoot = resolve(examplesRoot, structure.sourceDirectory);
const entryParts = structure.entryFile.split("/");
const entrySuffix = entryParts.join(sep);
const check = process.argv.includes("--check");

const commonSolidFiles = {
    "index.html": `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
            html,
            body {
                padding: 0;
                margin: 0;
            }
            #root {
                display: grid;
                height: 100vh;
            }
        </style>
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="./src/index.tsx"></script>
    </body>
</html>
`,
    "src/index.tsx": `import { render } from "solid-js/web";
import App from "./code";

const container = document.getElementById("root");

if (!container) {
    throw new Error("Example root element is missing");
}

render(() => <App />, container);
`,
    "tsconfig.json": `{
    "compilerOptions": {
        "noEmit": true,
        "jsx": "preserve",
        "jsxImportSource": "solid-js",
        "lib": ["DOM", "DOM.Iterable", "ES2023"],
        "moduleResolution": "Bundler",
        "module": "ESNext",
        "target": "ESNext",
        "strict": true,
        "types": ["vite/client"]
    }
}
`,
    "vite.config.ts": `import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
    plugins: [solid()]
});
`
};

const packageVersions = {
    core: JSON.parse(
        await readFile(
            resolve(repositoryRoot, "packages/virtual/core/package.json"),
            "utf8"
        )
    ).version,
    solid: JSON.parse(
        await readFile(
            resolve(repositoryRoot, "packages/virtual/solid/package.json"),
            "utf8"
        )
    ).version
};

const getFiles = async directory => {
    const entries = await readdir(directory, { withFileTypes: true });
    return (
        await Promise.all(
            entries.map(entry => {
                if (entry.name === "dist" || entry.name === "node_modules") {
                    return [];
                }
                const path = resolve(directory, entry.name);
                return entry.isDirectory() ? getFiles(path) : [path];
            })
        )
    ).flat();
};

const getImplementationDirectory = entryFile =>
    entryParts.reduce(directory => dirname(directory), entryFile);

const getPackageJson = implementationPath => {
    const segments = implementationPath.split("/");
    const framework = segments.pop();
    const project = segments.shift();
    const dependencies = {
        "@af-utils/virtual-core": packageVersions.core,
        "@af-utils/virtual-solid": packageVersions.solid,
        "solid-js": "^1.9.14"
    };

    return `${JSON.stringify(
        {
            name: `@af-utils/${[project, "examples", framework, ...segments].join("-")}`,
            version: "0.0.1",
            private: true,
            scripts: {
                dev: "vite",
                build: "tsc && vite build",
                serve: "vite preview"
            },
            type: "module",
            dependencies,
            devDependencies: {
                typescript: "^6.0.3",
                vite: "^8.2.1",
                "vite-plugin-solid": "^2.11.14"
            }
        },
        null,
        4
    )}\n`;
};

const syncFile = async (path, content) => {
    if (check) {
        const current = await readFile(path, "utf8").catch(() => {});
        if (current !== content) {
            throw new Error(
                `${relative(repositoryRoot, path)} is not synchronized`
            );
        }
        return;
    }

    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
};

const entryFiles = (await getFiles(sourceRoot)).filter(path =>
    path.endsWith(`${sep}${entrySuffix}`)
);

await Promise.all(
    entryFiles.map(async entryFile => {
        const implementationDirectory = getImplementationDirectory(entryFile);
        const implementationPath = relative(sourceRoot, implementationDirectory)
            .split(sep)
            .join("/");
        const framework = implementationPath.split("/").at(-1);
        if (framework === "solid") {
            await Promise.all(
                Object.entries(commonSolidFiles).map(([file, content]) =>
                    syncFile(resolve(implementationDirectory, file), content)
                )
            );
            await syncFile(
                resolve(implementationDirectory, "package.json"),
                getPackageJson(implementationPath)
            );
        }

        const sharedStyle = await readFile(
            resolve(implementationDirectory, "..", "style.module.css"),
            "utf8"
        ).catch(() => {});
        if (sharedStyle !== undefined) {
            const styleFile = resolve(
                implementationDirectory,
                "src/style.module.css"
            );
            await syncFile(styleFile, sharedStyle);
            if (!check) await chmod(styleFile, 0o644);
        }
    })
);
