import { unified } from "@astrojs/markdown-remark";
import {
    exampleFrameworks,
    getExampleFrameworkDefinition
} from "@af-utils/examples/config";
import mdx from "@astrojs/mdx";
import lit from "@astrojs/lit";
import preact from "@astrojs/preact";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import solid from "@astrojs/solid-js";
import svelte from "@astrojs/svelte";
import vue from "@astrojs/vue";
import tailwindcss from "@tailwindcss/vite";
import type { RehypePlugins } from "astro";
import { defineConfig } from "astro/config";
import icon from "astro-icon";
import { rehypePrettyCode } from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkToc from "remark-toc";
import { visit } from "unist-util-visit";
import { loadEnv } from "vite";
import examples from "./integrations/examples";
import { codeTheme } from "./src/utils/codeTheme";
import stripTrailingSlash from "./src/utils/stripTrailingSlash";

const env = loadEnv("", process.cwd(), "") as ImportMetaEnv;
const frameworkIcons = exampleFrameworks.map(framework =>
    getExampleFrameworkDefinition(framework).icon.split(":")
);
const getFrameworkIcons = (collection: string) =>
    frameworkIcons.flatMap(([prefix, iconName]) =>
        prefix === collection && iconName ? [iconName] : []
    );
const rehypeLinks: RehypePlugins[number] = () => tree =>
    visit(tree, "element", node => {
        if (node.tagName === "a" && typeof node.properties.href === "string") {
            const href = node.properties.href.replace(env.PUBLIC_ORIGIN, "");

            node.properties.href = href;

            if (href.startsWith("https://")) {
                node.properties.target = "_blank";
                node.properties.rel = ["noopener"];
            }
        }
    });
const rehypeScrollableTables: RehypePlugins[number] = () => tree =>
    visit(tree, "element", (node, index, parent) => {
        if (
            node.tagName !== "table" ||
            typeof index !== "number" ||
            !parent ||
            ("properties" in parent &&
                Array.isArray(parent.properties.className) &&
                parent.properties.className.includes("table-scroll"))
        ) {
            return;
        }

        parent.children[index] = {
            type: "element",
            tagName: "div",
            properties: { className: ["table-scroll"] },
            children: [node]
        };
    });

export default defineConfig({
    site: env.PUBLIC_ORIGIN,
    vite: {
        plugins: [tailwindcss()]
    },
    markdown: {
        processor: unified({
            rehypePlugins: [
                rehypeLinks,
                rehypeSlug,
                rehypeScrollableTables,
                [rehypePrettyCode, { theme: codeTheme, keepBackground: true }]
            ],
            remarkPlugins: [remarkToc, remarkGfm],
            gfm: true
        }),
        syntaxHighlight: false
    },
    devToolbar: {
        enabled: false
    },
    prefetch: {
        prefetchAll: true
    },
    integrations: [
        examples(),
        mdx(),
        preact({
            include: [
                "**/virtual/**/preact/src/code",
                "**/virtual/**/preact/**/*.{js,jsx,ts,tsx}"
            ]
        }),
        react({
            include: [
                "**/virtual/**/react/src/code",
                "**/virtual/**/react/**/*.{js,jsx,ts,tsx}",
                "**/scrollend-polyfill/react/**/src/code",
                "**/scrollend-polyfill/react/**/*.{js,jsx,ts,tsx}"
            ]
        }),
        solid({
            include: [
                "**/virtual/**/solid/src/code",
                "**/virtual/**/solid/**/*.{js,jsx,ts,tsx}"
            ]
        }),
        svelte({
            include: [
                "**/examples/src/virtual/**/svelte/src/code",
                "**/examples/src/virtual/**/svelte/**/*.{js,ts,svelte}"
            ]
        }),
        vue({
            include: [
                "**/examples/src/virtual/**/vue/src/code",
                "**/examples/src/virtual/**/vue/**/*.{js,ts,vue}"
            ]
        }),
        lit(),
        icon({
            include: {
                logos: [
                    ...getFrameworkIcons("logos"),
                    "github-icon",
                    "discord-icon",
                    "typescript-icon",
                    "javascript",
                    "css-3",
                    "html-5",
                    "nodejs-icon",
                    "vitejs"
                ],
                "simple-icons": getFrameworkIcons("simple-icons"),
                "material-symbols": [
                    "arrow-forward",
                    "arrow-back",
                    "chevron-right",
                    "data-object",
                    "description",
                    "folder",
                    "folder-open",
                    "fullscreen",
                    "fullscreen-exit",
                    "left-panel-close",
                    "left-panel-open",
                    "menu",
                    "close",
                    "settings"
                ]
            }
        }),
        sitemap({
            filter: page =>
                !page.startsWith(`${env.PUBLIC_ORIGIN}/examples`) &&
                !page.startsWith(`${env.PUBLIC_ORIGIN}/example-source`),
            serialize(item) {
                // trailing slashes must be the same as canonical links
                item.url = stripTrailingSlash(item.url);
                return item;
            }
        })
    ]
});
