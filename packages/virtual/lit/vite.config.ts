import { defineConfig } from "vitest/config";
import { browserBuildTarget } from "../../../scripts/browser-build-target.mjs";

export default defineConfig(({ isSsrBuild }) => ({
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
            external: ["@af-utils/virtual-core", "lit", /^lit\//u],
            output: isSsrBuild ? { entryFileNames: "index.node.js" } : undefined
        }
    },
    test: { environment: "jsdom" }
}));
