import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import glob from "fast-glob";

const htmls = glob
    .sync(["./src/**/index.html", "!**/lib/**index.html"])
    .sort((a, b) => a.localeCompare(b));

export default defineConfig({
    plugins: [react()],
    base: "",
    build: {
        outDir: "./lib",
        rollupOptions: {
            input: htmls
        }
    }
});
