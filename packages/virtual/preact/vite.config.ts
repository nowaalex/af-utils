import preactPreset from "@preact/preset-vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ isSsrBuild }) => ({
    plugins: [preactPreset()],
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
            external: [
                "@af-utils/virtual-core",
                "preact",
                "preact/compat",
                "preact/hooks",
                "preact/jsx-runtime"
            ],
            output: isSsrBuild ? { entryFileNames: "index.node.js" } : undefined
        }
    },
    test: { environment: "jsdom" }
}));
