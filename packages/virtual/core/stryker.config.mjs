/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
    testRunner: "vitest",
    plugins: ["@stryker-mutator/vitest-runner"],
    coverageAnalysis: "perTest",
    ignorePatterns: ["dist", ".jit"],
    mutate: [
        "src/models/SizeIndex/index.ts",
        "src/models/VirtualScroller/events/index.ts",
        "src/models/VirtualScroller/scrollActivity/index.ts",
        "src/models/VirtualScroller/stickyElements/index.ts",
        "src/models/VirtualScrollerLayout/index.ts",
        "src/platform/scrollerAdapters/index.ts",
        "src/platform/axisAdapters/index.ts",
        "src/utils/fTree/index.ts",
        "src/utils/rangeMappers/index.ts",
        "!src/**/*.test.ts",
        "!src/**/*.bench.ts"
    ],
    reporters: ["progress", "clear-text", "html", "json"],
    thresholds: {
        high: 90,
        low: 80,
        break: 75
    },
    vitest: {
        configFile: "vitest.config.ts"
    }
};

export default config;
