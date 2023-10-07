import tsConfig from "./tsconfig.json" assert { type: "json" };

/** @type {import('ts-jest').JestConfigWithTsJest} */

export default {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    modulePaths: [tsConfig.compilerOptions.baseUrl]
};
