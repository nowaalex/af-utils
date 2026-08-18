import { resolve } from "node:path";
import { chromium, firefox, webkit } from "@playwright/test";
import { build } from "esbuild";
import {
    formatMarkdownTable,
    getEnvironmentDescription,
    writeBenchmarkReport
} from "../utils.mjs";

const packageRoot = resolve(import.meta.dirname, "../../..");
const outputPath = resolve(
    process.env.PRIVATE_BROWSER_BENCH_OUTPUT ??
        resolve(import.meta.dirname, "latest-browser.md")
);
const bundle = await build({
    bundle: true,
    entryPoints: [
        resolve(packageRoot, "src/benchmarks/privateFieldFixture.ts")
    ],
    format: "iife",
    globalName: "PrivateFieldFixture",
    platform: "browser",
    target: "esnext",
    write: false
});
const fixtureCode = bundle.outputFiles[0].text;

const benchmark = () => {
    const { NativePrivateState, TypeScriptPrivateState } =
        globalThis.PrivateFieldFixture;
    const OPERATIONS_PER_BATCH = 100_000;
    const HOT_BATCHES_PER_ROUND = 20;
    const WARMUP_ROUNDS = 5;
    const MEASURED_ROUNDS = 15;
    let numericSink = 0.0;

    // oxlint-disable unicorn/consistent-function-scoping -- page.evaluate serializes this function, so browser-realm helpers must remain inside it.
    const median = values => {
        const sorted = values.toSorted((a, b) => a - b);
        return sorted[sorted.length >> 1];
    };

    const measureNanosecondsPerOperation = (work, operationCount) => {
        const start = performance.now();
        work();
        return ((performance.now() - start) * 1_000_000) / operationCount;
    };
    // oxlint-enable unicorn/consistent-function-scoping

    const ordinaryState = new TypeScriptPrivateState(1);
    const nativeState = new NativePrivateState(1);

    const runOrdinaryMonomorphic = () => {
        let checksum = 0.0;

        for (let batch = 0; batch < HOT_BATCHES_PER_ROUND; batch++) {
            ordinaryState.reset(1);
            checksum += ordinaryState.run(OPERATIONS_PER_BATCH, batch);
        }

        numericSink = checksum;
    };

    const runNativeMonomorphic = () => {
        let checksum = 0.0;

        for (let batch = 0; batch < HOT_BATCHES_PER_ROUND; batch++) {
            nativeState.reset(1);
            checksum += nativeState.run(OPERATIONS_PER_BATCH, batch);
        }

        numericSink = checksum;
    };

    const compare = ({ name, ordinary, native, operationCount }) => {
        for (let round = 0; round < WARMUP_ROUNDS; round++) {
            ordinary();
            native();
        }

        const ordinaryTimings = [];
        const nativeTimings = [];
        const pairedRatios = [];

        for (let round = 0; round < MEASURED_ROUNDS; round++) {
            let ordinaryTiming;
            let nativeTiming;

            if ((round & 1) === 0) {
                ordinaryTiming = measureNanosecondsPerOperation(
                    ordinary,
                    operationCount
                );
                nativeTiming = measureNanosecondsPerOperation(
                    native,
                    operationCount
                );
            } else {
                nativeTiming = measureNanosecondsPerOperation(
                    native,
                    operationCount
                );
                ordinaryTiming = measureNanosecondsPerOperation(
                    ordinary,
                    operationCount
                );
            }

            ordinaryTimings.push(ordinaryTiming);
            nativeTimings.push(nativeTiming);
            pairedRatios.push(nativeTiming / ordinaryTiming);
        }

        return {
            scenario: name,
            privateNsPerOperation: median(ordinaryTimings),
            nativePrivateNsPerOperation: median(nativeTimings),
            nativePrivateDelta: (median(pairedRatios) - 1) * 100
        };
    };

    const results = [
        compare({
            name: "monomorphic hot loop",
            ordinary: runOrdinaryMonomorphic,
            native: runNativeMonomorphic,
            operationCount: OPERATIONS_PER_BATCH * HOT_BATCHES_PER_ROUND
        })
    ];

    void numericSink;
    return results;
};

const rows = [];
const selectedEngines = new Set(
    (process.env.PRIVATE_BENCH_ENGINES ?? "chromium,firefox,webkit").split(",")
);

// oxlint-disable eslint/no-await-in-loop -- Engines must run one at a time to avoid cross-browser CPU contention distorting the benchmark.
for (const [engineName, displayName, engine, executablePath] of [
    [
        "chromium",
        "Chromium",
        chromium,
        process.env.PRIVATE_BENCH_CHROMIUM_EXECUTABLE_PATH
    ],
    [
        "firefox",
        "Firefox",
        firefox,
        process.env.PRIVATE_BENCH_FIREFOX_EXECUTABLE_PATH
    ],
    [
        "webkit",
        "WebKit",
        webkit,
        process.env.PRIVATE_BENCH_WEBKIT_EXECUTABLE_PATH
    ]
]) {
    if (!selectedEngines.has(engineName)) continue;

    const browser = await engine.launch({
        executablePath,
        headless: true
    });

    try {
        const page = await browser.newPage();
        await page.addScriptTag({ content: fixtureCode });
        const results = await page.evaluate(benchmark);

        for (const result of results) {
            const row = {
                engine: displayName,
                version: browser.version(),
                scenario: result.scenario,
                "private ns/op": result.privateNsPerOperation.toFixed(3),
                "#private ns/op": result.nativePrivateNsPerOperation.toFixed(3),
                "#private delta": `${result.nativePrivateDelta.toFixed(2)}%`
            };
            rows.push(row);
            console.table([row]);
        }
    } finally {
        await browser.close();
    }
}
// oxlint-enable eslint/no-await-in-loop

if (rows.length === 0) {
    throw new Error("No benchmark engines were selected");
}

await writeBenchmarkReport(outputPath, [
    "# TypeScript private versus native private fields: browsers",
    "",
    "<!-- Generated by pnpm nx run @af-utils/virtual-core:bench:private:browser. Do not edit manually. -->",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Environment: ${getEnvironmentDescription()}`,
    "",
    "Lower timings are better. A positive delta means native `#private` is slower.",
    "",
    ...formatMarkdownTable(
        [
            "Engine",
            "Version",
            "Scenario",
            "private, ns/op",
            "#private, ns/op",
            "#private delta"
        ],
        rows.map(row => [
            row.engine,
            row.version,
            row.scenario,
            row["private ns/op"],
            row["#private ns/op"],
            row["#private delta"]
        ]),
        new Set([3, 4, 5])
    ),
    ""
]);
