import { describe, expect, test } from "vitest";

import { WORKER_RESULT_PREFIX } from "../src/protocol.js";
import { parseWorkerResult } from "../src/trace.js";

describe("runtime worker output", () => {
    test("recovers structured output after engine trace noise", () => {
        const result = {
            suite: "fixture",
            runtime: {
                name: "node" as const,
                version: "1",
                engine: "v8" as const,
                tier: "turbofan" as const
            },
            scenarios: ["one"],
            targets: [],
            checks: [],
            invocations: {},
            coverage: [],
            problems: []
        };
        const output = `trace\n${WORKER_RESULT_PREFIX}${JSON.stringify(result)}\n`;

        expect(parseWorkerResult(output)).toEqual(result);
    });
});
