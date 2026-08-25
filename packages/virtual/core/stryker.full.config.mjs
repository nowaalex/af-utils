import config from "./stryker.config.mjs";

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const fullConfig = {
    ...config,
    mutate: [
        "src/**/*.ts",
        "!src/**/*.test.ts",
        "!src/**/*.bench.ts",
        "!src/**/__mocks__/**",
        "!src/types/**",
        "!src/index.ts",
        "!src/index.node.ts",
        "!src/polyfill.ts"
    ]
};

export default fullConfig;
