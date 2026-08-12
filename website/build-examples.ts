#!/usr/bin/env node

import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { chdir } from "node:process";
import glob from "fast-glob";
import { parse } from "node-html-parser";
import { loadEnv } from "vite";

const examplePagesPath = resolve("./src/pages/examples/");

const env = loadEnv(process.env.NODE_ENV as string, process.cwd(), "");

chdir("../examples/src/");

if (existsSync(examplePagesPath)) {
    await rm(examplePagesPath, { recursive: true });
}

const ASTRO_HARDCODED_ATTRS: Record<string, string> = {
    // astro has some bug with @emotion default imports, so switching off for this particular example
    "virtual/react/list/material-ui": 'client:only="react"'
} as const;

for (const path of await glob(["**/index.html", "!**/dist/**"])) {
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
        `<HeadFont />
        <link rel="canonical" href="${new URL(dir.replace(/\//, "/examples/"), env.PUBLIC_ORIGIN)}" />
        <style>
            body {color: #374151;}
        </style>`
    );

    /*
    scripts.length is 1 here;
    remove the standalone framework entry because Astro adds its own island.
    */
    scripts[0]!.remove();

    root.innerHTML = `<ExampleComponent ${ASTRO_HARDCODED_ATTRS[dir] || "client:idle"} />`;

    if (!existsSync(routePath)) {
        await mkdir(routePath, { recursive: true });
    }

    await writeFile(
        join(routePath, "index.astro"),
        `---
import ExampleComponent from "${codeImportPath}";
import HeadFont from "components/head/Font.astro";
---
            
${parsedFile.toString()}`
    );
}
