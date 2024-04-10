import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import glob from "fast-glob";

const htmls = glob.sync(["./src/**/index.html", "!**/lib/**index.html"]);

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
