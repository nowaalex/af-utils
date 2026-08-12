import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import type { AstroIntegration } from "astro";

const examplesDirectory = resolve("../examples/src");
const outputFile = resolve("src/generated/ExamplePreviews.astro");

interface Example {
    path: string;
    astroClientOnly?: string;
}

async function getExamplePaths(
    directory = examplesDirectory
): Promise<Example[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    const paths = await Promise.all(
        entries.map(async entry => {
            const entryPath = resolve(directory, entry.name);

            if (entry.isDirectory()) {
                return getExamplePaths(entryPath);
            }

            return entry.name === "code.tsx" &&
                dirname(entryPath).endsWith(`${sep}src`)
                ? [await getExample(dirname(dirname(entryPath)))]
                : [];
        })
    );

    return paths.flat();
}

async function getExample(directory: string): Promise<Example> {
    const packageJson = JSON.parse(
        await readFile(resolve(directory, "package.json"), "utf8")
    );

    return {
        path: relative(examplesDirectory, directory).split(sep).join("/"),
        astroClientOnly: packageJson["af-utils"]?.astroClientOnly
    };
}

function renderPreviewComponent(examples: Example[]) {
    const imports = examples
        .map(
            (example, index) =>
                `import Example${index} from "../../../examples/src/${example.path}/src/code";`
        )
        .join("\n");
    const previews = examples
        .map((example, index) => {
            const directive = example.astroClientOnly
                ? `client:only=${JSON.stringify(example.astroClientOnly)}`
                : "client:idle";

            return `{path === ${JSON.stringify(example.path)} && <Example${index} ${directive} />}`;
        })
        .join("\n    ");

    return `---
${imports}

interface Props {
    path: string;
}

const { path } = Astro.props;
---

<Fragment>
    ${previews}
</Fragment>
`;
}

export default function examples(): AstroIntegration {
    return {
        name: "examples",
        hooks: {
            "astro:config:setup": async () => {
                const paths = (await getExamplePaths()).sort((a, b) =>
                    a.path.localeCompare(b.path)
                );
                await mkdir(dirname(outputFile), { recursive: true });
                await writeFile(outputFile, renderPreviewComponent(paths));
            }
        }
    };
}
