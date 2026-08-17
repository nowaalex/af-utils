import { describe, expect, test } from "vitest";

import {
    HOT_WORKER_PROTOCOL_VERSION,
    WORKER_RESULT_PREFIX
} from "../src/protocol.js";
import type { HotWorkerRequest } from "../src/protocol.js";
import { parseWorkerResult } from "../src/trace.js";
import type { HotWorkerResult } from "../src/types.js";

const request: HotWorkerRequest = {
    requestId: "550e8400-e29b-41d4-a716-446655440000",
    suiteUrl: "file:///fixture.mjs",
    runtime: "node",
    tier: "turbofan",
    mode: "combined",
    scenarios: ["one"],
    inspect: false,
    purpose: "measurement"
};
const result: HotWorkerResult = {
    suite: "fixture",
    runtime: {
        name: "node",
        version: "1",
        engine: "v8",
        engineVersion: "1",
        tier: "turbofan",
        oracleId: "v8-native-intrinsics",
        oracleVersion: "1"
    },
    scenarios: ["one"],
    targets: [],
    checks: [],
    invocations: {},
    coverage: [],
    problems: [],
    events: []
};
const record = (
    overrides: Record<string, unknown> = {},
    worker: HotWorkerResult = result
) =>
    `${WORKER_RESULT_PREFIX}${JSON.stringify({
        protocolVersion: HOT_WORKER_PROTOCOL_VERSION,
        requestId: request.requestId,
        runtime: request.runtime,
        tier: request.tier,
        mode: request.mode,
        scenarios: request.scenarios,
        purpose: request.purpose,
        result: worker,
        ...overrides
    })}`;
const expectation = { request, obligationIds: [] };

describe("runtime worker output", () => {
    test("recovers one authenticated result after engine trace noise", () => {
        const output = `trace without a newline ${record()}\nmore trace\n`;

        expect(parseWorkerResult(expectation, output)).toEqual({
            worker: result
        });
    });

    test("rejects duplicate terminal records", () => {
        const output = `${record()}\n${record()}\n`;

        expect(parseWorkerResult(expectation, output).error).toContain(
            "received 2"
        );
    });

    test("rejects malformed and request-inconsistent records", () => {
        expect(
            parseWorkerResult(
                expectation,
                `${WORKER_RESULT_PREFIX}{not-json}\n`
            ).error
        ).toContain("not valid JSON");
        expect(
            parseWorkerResult(expectation, `${record({ runtime: "deno" })}\n`)
                .error
        ).toContain("differs from its request in runtime");
    });

    test("rejects runtime metadata that does not describe the requested engine", () => {
        const jscClaimFromNode = {
            ...result,
            runtime: {
                ...result.runtime,
                engine: "jsc",
                tier: "jsc",
                oracleId: "bun-jsc-public-api"
            }
        } as unknown as HotWorkerResult;
        const wrongV8Oracle = {
            ...result,
            runtime: {
                ...result.runtime,
                oracleId: "bun-jsc-public-api"
            }
        } as unknown as HotWorkerResult;

        expect(
            parseWorkerResult(expectation, `${record({}, jscClaimFromNode)}\n`)
                .error
        ).toContain("terminal protocol schema failed");
        expect(
            parseWorkerResult(expectation, `${record({}, wrongV8Oracle)}\n`)
                .error
        ).toContain("terminal protocol schema failed");
    });

    test("rejects target engine and tier claims that differ from the request", () => {
        const jscTarget = {
            ...result,
            targets: [
                {
                    id: "target",
                    functionName: "target",
                    engine: "jsc",
                    compiledHistorically: true,
                    currentTier: "not-observable",
                    dfgCompiles: 1,
                    reoptimizationRetries: 0,
                    compileTime: 1
                }
            ]
        } as HotWorkerResult;
        const wrongV8Tier = {
            ...result,
            targets: [
                {
                    id: "target",
                    functionName: "target",
                    engine: "v8",
                    optimized: true,
                    requestedTier: "maglev",
                    activeTier: "maglev",
                    status: 1
                }
            ]
        } as HotWorkerResult;

        expect(
            parseWorkerResult(expectation, `${record({}, jscTarget)}\n`).error
        ).toContain("result.targets.engine");
        expect(
            parseWorkerResult(expectation, `${record({}, wrongV8Tier)}\n`).error
        ).toContain("result.targets.requestedTier");
    });

    test("rejects incomplete successful obligation coverage", () => {
        expect(
            parseWorkerResult(
                { request, obligationIds: ["obligation:one"] },
                `${record()}\n`
            ).error
        ).toContain("does not account for every expected obligation");
    });

    test("rejects incomplete diagnostic coverage despite an allowed tier verdict", () => {
        const diagnosticRequest: HotWorkerRequest = {
            ...request,
            purpose: "diagnostic",
            diagnostic: "v8-ic-maps"
        };
        const diagnosticResult: HotWorkerResult = {
            ...result,
            problems: [
                {
                    problemId: "v8-tier-mismatch",
                    message: "target compiled in a different tier"
                }
            ]
        };

        expect(
            parseWorkerResult(
                {
                    request: diagnosticRequest,
                    obligationIds: ["obligation:one"]
                },
                `${record(
                    {
                        purpose: "diagnostic",
                        diagnostic: "v8-ic-maps"
                    },
                    diagnosticResult
                )}\n`
            ).error
        ).toContain("does not account for every expected obligation");
    });

    test("distinguishes a missing result from an invalid result", () => {
        expect(parseWorkerResult(expectation, "trace only\n")).toEqual({});
    });
});
