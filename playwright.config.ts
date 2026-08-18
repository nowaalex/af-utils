import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const port = Number.parseInt(process.env.AF_E2E_PORT ?? "4173", 10);
const baseURL = `http://127.0.0.1:${port}`;
const websiteRoot = fileURLToPath(new URL("./website", import.meta.url));

export default defineConfig({
    testDir: "./examples",
    testMatch: "**/tests/**/*.spec.ts",
    ...(process.env.AF_E2E_OUTPUT_DIR
        ? { outputDir: process.env.AF_E2E_OUTPUT_DIR }
        : {}),
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI
        ? [["github"], ["html", { open: "never" }]]
        : "list",
    use: {
        baseURL,
        launchOptions: {
            ignoreDefaultArgs: ["--hide-scrollbars"]
        },
        screenshot: "only-on-failure",
        trace: "on-first-retry",
        viewport: { width: 1280, height: 720 }
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] }
        },
        {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] }
        }
    ],
    webServer: {
        command: `node preview.mjs --host 127.0.0.1 --port ${port}`,
        cwd: websiteRoot,
        url: baseURL,
        reuseExistingServer: !process.env.CI
    }
});
