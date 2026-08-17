/** @type {import('@stryker-mutator/core').PartialStrykerOptions} */
export default {
    $schema: "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
    packageManager: "pnpm",
    testRunner: "vitest",
    plugins: ["@stryker-mutator/vitest-runner"],
    mutate: [
        "src/analyzer/annotation-binding.ts",
        "src/analyzer/export-star-resolution.ts",
        "src/concurrency.ts",
        "src/analyzer/rules/**/detector.ts",
        "src/analyzer/rules/**/experiment.ts",
        "src/analyzer/rules/dataflow.ts",
        "src/analyzer/rules/dataflow/binding-writes.ts",
        "src/analyzer/rules/value-kinds.ts",
        "src/analyzer/runtime-locations/v8-code-creation/derive.ts",
        "src/mutation-safety.ts",
        "src/mutations.ts",
        "src/public-target/index.ts",
        "src/problems/definition.ts",
        "src/runtime-events/index.ts",
        "src/sample-selection/index.ts",
        "src/runtime-oracles/v8-ic-maps/parse.ts",
        "src/runtime-oracles/v8-ic-maps/check.ts",
        "src/runtime-oracles/cpu-hotness/parse.ts",
        "src/runtime-oracles/jsc-sampling/parse.ts",
        "src/artifacts/index.ts"
    ],
    testFiles: [
        "src/analyzer/rules/**/*.test.ts",
        "src/analyzer/runtime-locations/**/*.test.ts",
        "src/concurrency.test.ts",
        "tests/ast/**/*.test.ts",
        "tests/mutations/**/*.test.ts",
        "src/public-target/index.test.ts",
        "src/problems/catalog.test.ts",
        "src/runtime-events/index.test.ts",
        "src/sample-selection/index.test.ts",
        "src/runtime-oracles/v8-ic-maps/parse.test.ts",
        "src/runtime-oracles/v8-ic-maps/check.test.ts",
        "src/runtime-oracles/cpu-hotness/parse.test.ts",
        "src/runtime-oracles/jsc-sampling/parse.test.ts",
        "src/artifacts/index.test.ts",
        "src/artifacts/streaming.test.ts"
    ],
    // ESM top-level initializers execute before Stryker activates one mutant,
    // so those mutants cannot be isolated. Their exact tables/allowlists are
    // covered by ordinary unit tests; mutation scoring stays on runtime code.
    ignoreStatic: true,
    coverageAnalysis: "perTest",
    concurrency: 4,
    reporters: ["clear-text", "progress", "json"],
    clearTextReporter: {
        logTests: false,
        reportTests: false,
        reportMutants: false,
        reportScoreTable: true
    },
    jsonReporter: {
        fileName: "reports/mutation/mutation.json"
    },
    // Ratchet for the configured deterministic scope above. Keep the complete
    // JSON report from a fresh unfiltered run before changing this threshold;
    // focused parser runs are useful controls but are not aggregate evidence.
    thresholds: { high: 96, low: 95.5, break: 95.5 },
    vitest: { dir: ".", related: true },
    tempDirName: ".stryker-tmp"
};
