import tsConfig from "./tsconfig.json";

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    modulePaths: [tsConfig.compilerOptions.baseUrl]
};
