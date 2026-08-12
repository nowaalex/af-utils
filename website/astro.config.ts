import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import solid from "@astrojs/solid-js";
import tailwindcss from "@tailwindcss/vite";
import type { RehypePlugins } from "astro";
import { defineConfig } from "astro/config";
import icon from "astro-icon";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkToc from "remark-toc";
import { visit } from "unist-util-visit";
import { loadEnv } from "vite";
import stripTrailingSlash from "./src/utils/stripTrailingSlash";

const env = loadEnv("", process.cwd(), "") as ImportMetaEnv;
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
                [
                    rehypePrettyCode,
                    { theme: "light-plus", keepBackground: false }
                ]
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
        mdx(),
        react({
            include: [
                "**/virtual/react/**/src/code",
                "**/virtual/react/**/*.{js,jsx,ts,tsx}",
                "**/scrollend-polyfill/react/**/src/code",
                "**/scrollend-polyfill/react/**/*.{js,jsx,ts,tsx}"
            ]
        }),
        solid({
            include: [
                "**/virtual/solid/**/src/code",
                "**/virtual/solid/**/*.{js,jsx,ts,tsx}"
            ]
        }),
        icon({
            include: {
                "material-symbols": [
                    "arrow-forward",
                    "arrow-back",
                    "menu",
                    "close"
                ],
                "simple-icons": [
                    "github",
                    "discord",
                    "codesandbox",
                    "stackblitz"
                ]
            }
        }),
        sitemap({
            filter: page => !page.startsWith(env.PUBLIC_ORIGIN + "/examples"),
            serialize(item) {
                // trailing slashes must be the same as canonical links
                item.url = stripTrailingSlash(item.url);
                return item;
            }
        })
    ]
});
