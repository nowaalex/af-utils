import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig(({ isSsrBuild }) => ({
    plugins: [solid({ solid: { hydratable: true }, ssr: isSsrBuild })],
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
            external: ["@af-utils/virtual-core", "solid-js", "solid-js/web"],
            output: isSsrBuild ? { entryFileNames: "index.node.js" } : undefined
        }
    },
    test: {
        environment: "jsdom"
    }
}));
