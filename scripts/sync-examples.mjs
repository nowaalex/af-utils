import { chmod, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const examplesRoot = resolve(repositoryRoot, "examples");
const structure = JSON.parse(
    await readFile(resolve(examplesRoot, "structure.json"), "utf8")
);
const sourceRoot = resolve(examplesRoot, structure.sourceDirectory);
const frameworkDefinitions = structure.frameworks;
const entrySuffixes = Object.values(frameworkDefinitions).map(definition =>
    definition.entryFile.split("/").join(sep)
);
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

const commonVueFiles = {
    "index.html": commonSolidFiles["index.html"].replace(
        "./src/index.tsx",
        "./src/index.ts"
    ),
    "src/index.ts": `import { createApp } from "vue";
import App from "./code.vue";

const container = document.getElementById("root");
if (!container) throw new Error("Example root element is missing");
createApp(App).mount(container);
`,
    "tsconfig.json": `{
    "compilerOptions": {
        "noEmit": true,
        "lib": ["DOM", "DOM.Iterable", "ES2023"],
        "moduleResolution": "Bundler",
        "module": "ESNext",
        "target": "ESNext",
        "strict": true,
        "types": ["vite/client"]
    }
}
`,
    "vite.config.ts": `import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [vue()] });
`
};

const commonPreactFiles = {
    "index.html": commonSolidFiles["index.html"],
    "src/index.tsx": `import { render } from "preact";
import App from "./code";

const container = document.getElementById("root");

if (!container) {
    throw new Error("Example root element is missing");
}

render(<App />, container);
`,
    "tsconfig.json": `{
    "compilerOptions": {
        "noEmit": true,
        "jsx": "react-jsx",
        "jsxImportSource": "preact",
        "lib": ["DOM", "DOM.Iterable", "ES2023"],
        "moduleResolution": "Bundler",
        "module": "ESNext",
        "target": "ESNext",
        "strict": true,
        "types": ["vite/client"]
    }
}
`,
    "vite.config.ts": `import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [preact()] });
`
};

const commonSvelteFiles = {
    "index.html": commonSolidFiles["index.html"].replace(
        "./src/index.tsx",
        "./src/index.ts"
    ),
    "src/index.ts": `import { mount } from "svelte";
import App from "./code.svelte";

const container = document.getElementById("root");
if (!container) throw new Error("Example root element is missing");
mount(App, { target: container });
`,
    "tsconfig.json": `{
    "compilerOptions": {
        "noEmit": true,
        "lib": ["DOM", "DOM.Iterable", "ES2023"],
        "moduleResolution": "Bundler",
        "module": "ESNext",
        "target": "ESNext",
        "strict": true,
        "types": ["vite/client"]
    },
    "include": ["src/**/*.ts", "src/**/*.svelte"]
}
`,
    "vite.config.ts": `import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [svelte()] });
`
};

const commonLitFiles = {
    "index.html": commonSolidFiles["index.html"].replace(
        '<div id="root"></div>',
        "<virtual-example></virtual-example>"
    ),
    "src/index.tsx": `import App from "./code";

customElements.define("virtual-example", App);
`,
    "tsconfig.json": `{
    "compilerOptions": {
        "noEmit": true,
        "experimentalDecorators": true,
        "useDefineForClassFields": false,
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

export default defineConfig({});
`
};

const coreVersion = JSON.parse(
    await readFile(
        resolve(repositoryRoot, "packages/virtual/core/package.json"),
        "utf8"
    )
).version;
const adapterVersions = Object.fromEntries(
    await Promise.all(
        Object.entries(frameworkDefinitions).map(
            async ([framework, definition]) => [
                framework,
                JSON.parse(
                    await readFile(
                        resolve(
                            repositoryRoot,
                            definition.adapterDirectory,
                            "package.json"
                        ),
                        "utf8"
                    )
                ).version
            ]
        )
    )
);

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

const getImplementationDirectory = (entryFile, entrySuffix) =>
    entrySuffix.split(sep).reduce(directory => dirname(directory), entryFile);

const getPackageJson = implementationPath => {
    const segments = implementationPath.split("/");
    const framework = segments.pop();
    const project = segments.shift();
    const definition = frameworkDefinitions[framework];
    if (!definition) throw new Error(`Unknown framework: ${framework}`);
    const dependencies = {
        "@af-utils/virtual-core": coreVersion,
        [definition.adapterPackage]: adapterVersions[framework],
        ...definition.dependencies
    };

    return `${JSON.stringify(
        {
            name: `@af-utils/${[project, "examples", framework, ...segments].join("-")}`,
            version: "0.0.1",
            private: true,
            scripts: {
                dev: "vite",
                build: definition.build,
                serve: "vite preview"
            },
            type: "module",
            dependencies,
            devDependencies: {
                typescript: "^6.0.3",
                vite: "^8.2.1",
                ...definition.devDependencies
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

const entryFiles = (await getFiles(sourceRoot)).flatMap(path => {
    const entrySuffix = entrySuffixes.find(suffix =>
        path.endsWith(`${sep}${suffix}`)
    );
    return entrySuffix ? [{ entryFile: path, entrySuffix }] : [];
});

await Promise.all(
    entryFiles.map(async ({ entryFile, entrySuffix }) => {
        const implementationDirectory = getImplementationDirectory(
            entryFile,
            entrySuffix
        );
        const implementationPath = relative(sourceRoot, implementationDirectory)
            .split(sep)
            .join("/");
        const framework = implementationPath.split("/").at(-1);
        if (
            entrySuffix !==
            frameworkDefinitions[framework].entryFile.split("/").join(sep)
        ) {
            return;
        }
        const commonFilesByTemplate = {
            solid: commonSolidFiles,
            vue: commonVueFiles,
            lit: commonLitFiles,
            preact: commonPreactFiles,
            svelte: commonSvelteFiles
        };
        const template = frameworkDefinitions[framework].template;
        const commonFiles = commonFilesByTemplate[template];
        if (commonFiles) {
            await Promise.all(
                Object.entries(commonFiles).map(([file, content]) =>
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
