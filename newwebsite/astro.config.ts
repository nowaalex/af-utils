import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import { visit } from "unist-util-visit";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import dotenv from "dotenv";
import remarkToc from "remark-toc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import icon from "astro-icon";
import type { Root } from "hast";

dotenv.config({ path: ".env.local" });

const rehypeLinks = () => (tree: Root) =>
    visit(tree, "element", node => {
        if (node.tagName === "a" && typeof node.properties.href === "string") {
            const href = node.properties.href.replace(
                process.env.PUBLIC_ORIGIN as string,
                ""
            );

            node.properties.href = href;

            if (href.startsWith("https://")) {
                node.properties.target = "_blank";
                node.properties.rel = "noopener";
            }
        }
    });

// https://astro.build/config
export default defineConfig({
    site: process.env.PUBLIC_ORIGIN as string,
    markdown: {
        rehypePlugins: [
            rehypeLinks,
            rehypeSlug,
            [rehypePrettyCode, { theme: "github-light", keepBackground: false }]
        ],
        remarkPlugins: [remarkToc, remarkGfm],
        gfm: true,
        syntaxHighlight: false
    },
    prefetch: {
        prefetchAll: true
    },
    integrations: [
        tailwind({ nesting: true, applyBaseStyles: false }),
        mdx(),
        react(),
        icon(),
        sitemap()
    ]
});
