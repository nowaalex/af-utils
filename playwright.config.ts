import { defineConfig, devices } from "@playwright/test";

const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
    testDir: "./examples/src",
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
        }
    ],
    webServer: [
        {
            command:
                "pnpm --dir examples/src/virtual/react/list/variable-size-list dev --host 127.0.0.1 --port 4173",
            url: baseURL,
            reuseExistingServer: !process.env.CI
        },
        {
            command:
                "pnpm --dir examples/src/virtual/react/list/scroll-to-item dev --host 127.0.0.1 --port 4174",
            url: "http://127.0.0.1:4174",
            reuseExistingServer: !process.env.CI
        },
        {
            command:
                "pnpm --dir examples/src/virtual/react/list/extra-events dev --host 127.0.0.1 --port 4175",
            url: "http://127.0.0.1:4175",
            reuseExistingServer: !process.env.CI
        },
        {
            command:
                "pnpm --dir examples/src/virtual/react/list/sticky-header-and-footer dev --host 127.0.0.1 --port 4176",
            url: "http://127.0.0.1:4176",
            reuseExistingServer: !process.env.CI
        },
        {
            command:
                "pnpm --dir examples/src/virtual/react/hook/simple dev --host 127.0.0.1 --port 4177",
            url: "http://127.0.0.1:4177",
            reuseExistingServer: !process.env.CI
        },
        {
            command:
                "pnpm --dir examples/src/virtual/react/list/prepend-items dev --host 127.0.0.1 --port 4178",
            url: "http://127.0.0.1:4178",
            reuseExistingServer: !process.env.CI
        },
        {
            command:
                "pnpm --dir examples/src/virtual/react/hook/different-scroll-element dev --host 127.0.0.1 --port 4180",
            url: "http://127.0.0.1:4180",
            reuseExistingServer: !process.env.CI
        },
        {
            command:
                "pnpm --dir examples/src/virtual/react/hook/simple build && pnpm --dir examples/src/virtual/react/hook/simple serve --host 127.0.0.1 --port 4181",
            url: "http://127.0.0.1:4181",
            reuseExistingServer: !process.env.CI
        },
        {
            command:
                "pnpm --dir examples/src/virtual/solid/list/simple dev --host 127.0.0.1 --port 4182",
            url: "http://127.0.0.1:4182",
            reuseExistingServer: !process.env.CI
        },
        {
            command:
                "ASTRO_DEV_BACKGROUND=1 pnpm --dir website exec astro dev --ignore-lock --host 127.0.0.1 --port 4179",
            url: "http://127.0.0.1:4179/virtual/examples/react/list/prepend-items",
            reuseExistingServer: !process.env.CI
        }
    ]
});
