#!/usr/bin/env node
// @ts-check

import { chdir } from "node:process";
import { dirname, relative, resolve, join } from "node:path";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import glob from "fast-glob";
import { parse } from "node-html-parser";

const examplePagesPath = resolve("./src/pages/examples/");

chdir("../examples/src/");

if (existsSync(examplePagesPath)) {
    await rm(examplePagesPath, { recursive: true });
}

for (const path of await glob(["**/index.html", "!**/lib/**"])) {
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

    // scripts.length is 1 here
    // @ts-ignore
    scripts[0].remove();

    root.innerHTML = '<ReactExample client:only="react" />';

    const dir = dirname(path);
    const routePath = join(examplePagesPath, dir);
    const codeImportPath = relative(routePath, join(dir, "/src/code"));

    if (!existsSync(routePath)) {
        await mkdir(routePath, { recursive: true });
    }

    await writeFile(
        join(routePath, "index.astro"),
        "---\n" +
            `import ReactExample from "${codeImportPath}";\n` +
            "---\n\n" +
            parsedFile.toString()
    );
}
