import { describe, expect, test } from "vitest";

import type { HotRuntimeInfo, HotSuite } from "../../src/types.js";
import { resolveHotWork, runHotPhase } from "../../src/worker-shared.js";

const runtime: HotRuntimeInfo = {
    name: "node",
    version: "26.0.0",
    engine: "v8",
    engineVersion: "14.1.0",
    tier: "turbofan",
    oracleId: "v8-native-intrinsics",
    oracleVersion: "1"
};
const increment = (value: number) => value + 1;

describe("phase invocation oracle", () => {
    test("rejects a target reached during warmup but omitted from stress", async () => {
        const suite: HotSuite<{ fn: typeof increment }> = {
            name: "warmup-only",
            setup: () => ({ fn: increment }),
            scenarios: [
                {
                    id: "warmup-only",
                    targets: [
                        {
                            id: "fn",
                            annotation: false,
                            resolve: state => state.fn
                        }
                    ],
                    warmupIterations: 1,
                    stressIterations: 1,
                    run(context) {
                        if (context.phase === "warmup") {
                            context.invoke("fn", undefined, [1]);
                        }
                    }
                }
            ]
        };
        const work = await resolveHotWork(
            suite as HotSuite<unknown>,
            ["warmup-only"],
            runtime,
            false
        );

        await runHotPhase(work, runtime, "warmup", () => {});
        await expect(
            runHotPhase(work, runtime, "stress", () => {})
        ).rejects.toThrow("was not invoked during stress");
    });
});
