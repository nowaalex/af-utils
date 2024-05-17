import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import { visit } from "unist-util-visit";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { loadEnv } from "vite";
import remarkToc from "remark-toc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import icon from "astro-icon";
import stripTrailingSlash from "./src/utils/stripTrailingSlash";
import type { RehypePlugins } from "astro";

const env = loadEnv("", process.cwd(), "") as ImportMetaEnv;
const rehypeLinks: RehypePlugins[number] = () => tree =>
    visit(tree, "element", node => {
        if (node.tagName === "a" && typeof node.properties.href === "string") {
            const href = node.properties.href.replace(env.PUBLIC_ORIGIN, "");

            node.properties.href = href;

            if (href.startsWith("https://")) {
                node.properties.target = "_blank";
                node.properties.rel = "noopener";
            }
        }
    });

export default defineConfig({
    site: env.PUBLIC_ORIGIN,
    markdown: {
        rehypePlugins: [
            rehypeLinks,
            rehypeSlug,
            [rehypePrettyCode, { theme: "light-plus", keepBackground: false }]
        ],
        remarkPlugins: [remarkToc, remarkGfm],
        gfm: true,
        syntaxHighlight: false
    },
    devToolbar: {
        enabled: false
    },
    prefetch: {
        prefetchAll: true
    },
    integrations: [
        tailwind({ nesting: true, applyBaseStyles: false }),
        mdx(),
        react(),
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
