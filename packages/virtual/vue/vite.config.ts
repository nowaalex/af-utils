import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig(({ isSsrBuild }) => ({
    plugins: [vue()],
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
            external: ["@af-utils/virtual-core", "vue"],
            output: isSsrBuild ? { entryFileNames: "index.node.js" } : undefined
        }
    },
    test: { environment: "jsdom" }
}));
