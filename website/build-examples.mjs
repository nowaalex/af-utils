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

const ASTRO_HARDCODED_ATTRS = {
    // astro has some bug with @emotion default imports, so switching off for this particular example
    "virtual/react/list/material-ui": 'client:only="react"'
};

for (const path of await glob(["**/index.html", "!**/lib/**"])) {
    const fileContent = await readFile(path, { encoding: "utf-8" });
    const parsedFile = parse(fileContent);
    const scripts = parsedFile.querySelectorAll("script");

    if (scripts.length !== 1) {
        throw Error(`scripts.length !== 1; file: ${path}`);
    }

    const root = parsedFile.querySelector("#root");

    if (!root) {
        throw Error(`root is missing; file: ${path}`);
    }

    const head = parsedFile.querySelector("head");

    if (!head) {
        throw Error(`head is missing; file: ${path}`);
    }

    const dir = dirname(path);
    const routePath = join(examplePagesPath, dir);
    const codeImportPath = relative(routePath, join(dir, "/src/code"));

    head.insertAdjacentHTML(
        "beforeend",
        "<HeadFont />\n<style>\nbody {color: #374151;}\n</style>\n"
    );

    // scripts.length is 1 here
    // @ts-ignore
    scripts[0].remove();

    // @ts-ignore
    root.innerHTML = `<ReactExample ${ASTRO_HARDCODED_ATTRS[dir] || "client:idle"} />`;

    if (!existsSync(routePath)) {
        await mkdir(routePath, { recursive: true });
    }

    await writeFile(
        join(routePath, "index.astro"),
        "---\n" +
            `import ReactExample from "${codeImportPath}";\n` +
            `import HeadFont from "components/head/Font.astro";\n` +
            "---\n\n" +
            parsedFile.toString()
    );
}
