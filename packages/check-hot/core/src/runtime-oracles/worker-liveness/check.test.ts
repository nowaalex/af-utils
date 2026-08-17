import { describe, expect, test } from "vitest";

import { checkWorkerLiveness } from "./check.js";

describe("runtime worker liveness problems", () => {
    test("keeps timeout, missing result, and exit status distinct", () => {
        const error = Object.assign(new Error("timed out"), {
            code: "ETIMEDOUT"
        });

        expect(
            checkWorkerLiveness({
                error,
                status: null,
                signal: "SIGKILL",
                resultFound: false,
                timeoutMs: 500
            }).map(problem => problem.problemId)
        ).toEqual([
            "runtime-worker-timeout",
            "runtime-worker-result-missing",
            "runtime-worker-exit-failure"
        ]);
    });

    test("accepts a successful structured worker result", () => {
        expect(
            checkWorkerLiveness({
                status: 0,
                signal: null,
                resultFound: true,
                timeoutMs: 500
            })
        ).toEqual([]);
    });
});
