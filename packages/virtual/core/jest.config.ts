import type { JestConfigWithTsJest } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";

export default {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    modulePaths: [compilerOptions.baseUrl]
} satisfies JestConfigWithTsJest;
