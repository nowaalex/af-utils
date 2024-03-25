import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import { visit } from "unist-util-visit";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const rehypeLinks = () => tree =>
    visit(tree, "element", node => {
        if (node.tagName === "a" && typeof node.properties.href === "string") {
            const href = node.properties.href.replace(
                process.env.PUBLIC_ORIGIN,
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
    markdown: {
        rehypePlugins: [rehypeLinks]
    },
    prefetch: {
        prefetchAll: true
    },
    integrations: [
        tailwind({ nesting: true, applyBaseStyles: false }),
        mdx(),
        react()
    ]
});
