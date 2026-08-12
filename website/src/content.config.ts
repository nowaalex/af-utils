import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const reference = defineCollection({
    loader: glob({
        pattern: "**/*.md",
        base: "./src/content/reference",
        // TypeDoc symbol filenames intentionally preserve identifier casing.
        generateId: ({ entry }) => entry.replace(/\.md$/u, "")
    }),
    schema: z.object({
        description: z.string(),
        generated: z.literal(true),
        kind: z.string(),
        package: z.string(),
        referencePath: z.string(),
        symbol: z.string(),
        title: z.string()
    })
});

export const collections = { reference };
