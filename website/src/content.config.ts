import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

const reference = defineCollection({
    loader: glob({
        pattern: "**/*.md",
        base: "./src/content/reference",
        // TypeDoc symbol filenames intentionally preserve identifier casing.
        generateId: ({ entry }) => entry.replace(/\.md$/, "")
    })
});

export const collections = { reference };
