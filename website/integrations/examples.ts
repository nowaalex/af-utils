import { mkdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
    examplesDirectory,
    examplesImportPrefix,
    getExampleFrameworkDefinition
} from "@af-utils/examples/config";
import {
    type DiscoveredExample,
    discoverExamples
} from "@af-utils/examples/discovery";
import type { AstroIntegration } from "astro";

const getExampleImportPath = (example: DiscoveredExample) => {
    const codePath = relative(examplesDirectory, example.entryFile)
        .split(sep)
        .join("/");
    return `${examplesImportPrefix}${codePath}`;
};

const renderExamplePage = (example: DiscoveredExample) => {
    const customElementTag = getExampleFrameworkDefinition(
        example.framework
    ).customElementTag;

    if (customElementTag) {
        return `---
import ExamplePreview from "layouts/ExamplePreview.astro";
---

<ExamplePreview>
    <${customElementTag} />
</ExamplePreview>

<script>
    import ${JSON.stringify(getExampleImportPath(example))};
</script>
`;
    }

    return `---
import ExamplePreview from "layouts/ExamplePreview.astro";
import Example from ${JSON.stringify(getExampleImportPath(example))};
---

<ExamplePreview>
    <Example ${
        example.astroClientOnly
            ? `client:only=${JSON.stringify(example.astroClientOnly)}`
            : "client:visible"
    } />
</ExamplePreview>
`;
};

export default function examples(): AstroIntegration {
    return {
        name: "examples",
        hooks: {
            "astro:config:setup": async ({
                addWatchFile,
                createCodegenDir,
                injectRoute
            }) => {
                const discoveredExamples = await discoverExamples();
                const outputDirectory = fileURLToPath(createCodegenDir());

                addWatchFile(examplesDirectory);
                await Promise.all(
                    discoveredExamples.map(async example => {
                        const outputFile = resolve(
                            outputDirectory,
                            `${example.route.replaceAll("/", "--")}.astro`
                        );
                        await mkdir(dirname(outputFile), { recursive: true });
                        await writeFile(outputFile, renderExamplePage(example));
                        addWatchFile(example.entryFile);
                        injectRoute({
                            entrypoint: outputFile,
                            pattern: `/examples/${example.route}`,
                            prerender: true
                        });
                    })
                );
            }
        }
    };
}
