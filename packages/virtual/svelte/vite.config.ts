import { defineConfig } from "vitest/config";

export default defineConfig(({ isSsrBuild }) => ({
    build: {
        emptyOutDir: !isSsrBuild,
        ...(isSsrBuild
            ? { ssr: "src/index.ts" }
            : {
                  lib: {
                      entry: "src/index.ts",
                      formats: ["es"],
                      fileName: "index"
                  }
              }),
        rollupOptions: {
            external: ["@af-utils/virtual-core", "svelte", /^svelte\//u],
            output: isSsrBuild ? { entryFileNames: "index.node.js" } : undefined
        }
    },
    test: { environment: "jsdom" }
}));
