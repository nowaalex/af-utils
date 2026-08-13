import { resolve } from "node:path";
import { chromium, firefox, webkit } from "@playwright/test";
import { build } from "esbuild";

const packageRoot = resolve(import.meta.dirname, "..");
const bundle = await build({
    bundle: true,
    define: {
        "process.env.NODE_ENV": '"production"'
    },
    entryPoints: [
        resolve(packageRoot, "src/benchmarks/itemRegistrationFixture.ts")
    ],
    format: "iife",
    globalName: "ItemRegistrationFixture",
    nodePaths: [resolve(packageRoot, "../react/node_modules")],
    platform: "browser",
    target: "esnext",
    write: false
});
const fixtureCode = bundle.outputFiles[0].text;
const selectedEngines = new Set(
    (
        process.env.ITEM_REGISTRATION_BENCH_ENGINES ?? "chromium,firefox,webkit"
    ).split(",")
);

// oxlint-disable eslint/no-await-in-loop -- Engines must run sequentially to avoid cross-browser CPU contention.
for (const [engineName, engine, executablePath] of [
    [
        "chromium",
        chromium,
        process.env.ITEM_REGISTRATION_BENCH_CHROMIUM_EXECUTABLE_PATH
    ],
    [
        "firefox",
        firefox,
        process.env.ITEM_REGISTRATION_BENCH_FIREFOX_EXECUTABLE_PATH
    ],
    [
        "webkit",
        webkit,
        process.env.ITEM_REGISTRATION_BENCH_WEBKIT_EXECUTABLE_PATH
    ]
]) {
    if (!selectedEngines.has(engineName)) continue;

    const browser = await engine.launch({ executablePath, headless: true });
    try {
        const page = await browser.newPage();
        await page.addScriptTag({ content: fixtureCode });
        const results = await page.evaluate(() =>
            globalThis.ItemRegistrationFixture.runItemRegistrationBenchmark()
        );

        for (const result of results) {
            const row = {
                engine: engineName,
                scenario: result.scenario,
                "refs + WeakMap µs/update": result.refs.toFixed(2),
                "MO + row attr µs/update": result.vertical.toFixed(2),
                "MO + col attr µs/update": result.horizontal.toFixed(2),
                "row delta": `${((result.vertical / result.refs - 1) * 100).toFixed(1)}%`,
                "col delta": `${((result.horizontal / result.refs - 1) * 100).toFixed(1)}%`
            };
            console.table([row]);
        }
    } finally {
        await browser.close();
    }
}
// oxlint-enable eslint/no-await-in-loop
