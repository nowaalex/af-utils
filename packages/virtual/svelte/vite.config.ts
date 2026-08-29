import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";
import { browserBuildTarget } from "../../../scripts/browser-build-target.mjs";

export default defineConfig(({ isSsrBuild, mode }) => ({
    plugins: [svelte()],
    resolve: mode === "test" ? { conditions: ["browser"] } : undefined,
    build: {
        emptyOutDir: !isSsrBuild,
        target: browserBuildTarget,
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
