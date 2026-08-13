import { defineConfig, devices } from "@playwright/test";

const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
    testDir: "./examples",
    testMatch: "**/tests/**/*.spec.ts",
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
        },
        {
            name: "mobile-chrome",
            use: { ...devices["Pixel 5"] }
        },
        {
            name: "mobile-safari",
            use: { ...devices["iPhone 13"] }
        }
    ],
    webServer: {
        command: `pnpm --filter website preview --host 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI
    }
});
