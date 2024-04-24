import { normalize, dirname, relative, join } from "node:path";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import glob from "fast-glob";
import { parse } from "node-html-parser";

const examplePagesPath = "./src/pages/examples/";

await rm(examplePagesPath, { recursive: true });

for (const path of await glob([
    "../examples/src/**/index.html",
    "!**/lib/**"
])) {
    const fileContent = await readFile(path, { encoding: "utf-8" });
    const parsedFile = parse(fileContent);
    const scripts = parsedFile.querySelectorAll("script");

    if (scripts.length !== 1) {
        throw Error("scripts.length !== 1");
    }

    const root = parsedFile.querySelector("#root");

    if (!root) {
        throw Error("#root is missing");
    }

    scripts[0].remove();
    root.innerHTML = '<ReactExample client:only="react" />';

    const routePath = join(
        examplePagesPath + dirname(path.slice("../examples/src/".length))
    );

    const codeImportPath = relative(routePath, dirname(path) + "/src/code");

    if (!existsSync(routePath)) {
        await mkdir(routePath, { recursive: true });
    }

    await writeFile(
        routePath + "/index.astro",
        `---\nimport ReactExample from "${codeImportPath}";\n---\n${parsedFile.toString()}`
    );
}
