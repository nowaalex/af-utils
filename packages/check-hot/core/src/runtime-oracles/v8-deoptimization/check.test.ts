import { describe, expect, test } from "vitest";

import { V8_STRESS_END, V8_STRESS_START } from "../../protocol.js";
import {
    checkV8Deoptimizations,
    extractGuardedV8Trace,
    filterTargetDeoptimizations,
    findV8Deoptimizations
} from "./check.js";

describe("V8 guarded deoptimization", () => {
    test("ignores warmup and teardown deoptimizations outside sentinels", () => {
        const output = [
            "[bailout: warmup deoptimizing]",
            `[completed optimizing JSFunction ${V8_STRESS_START}]`,
            "[bailout (reason: wrong map): deoptimizing JSFunction guarded]",
            "[marking dependent code for deoptimization]",
            `[marking JSFunction ${V8_STRESS_END} for optimization]`,
            "[bailout: teardown deoptimizing]"
        ].join("\n");

        expect(extractGuardedV8Trace(output)).toHaveLength(2);
        expect(findV8Deoptimizations(output)).toHaveLength(2);
        expect(checkV8Deoptimizations([output], "all", []).problems).toEqual([
            expect.objectContaining({
                problemId: "v8-guarded-deoptimization"
            }),
            expect.objectContaining({
                problemId: "v8-guarded-deoptimization"
            })
        ]);
    });

    test("filters direct targets only for target scope", () => {
        const lines = [
            "deoptimizing <JSFunction selected (sfi=1)>",
            "deoptimizing <JSFunction nested (sfi=2)>"
        ];

        expect(filterTargetDeoptimizations(lines, ["selected"])).toEqual([
            lines[0]
        ]);
    });

    test("reports missing guarded boundaries as a proof gap", () => {
        expect(
            checkV8Deoptimizations(
                ["deoptimizing <JSFunction unbounded>"],
                "all",
                []
            )
        ).toEqual({
            guardedTraceFound: false,
            deoptimizations: [],
            problems: [
                {
                    problemId: "v8-trace-boundary-missing",
                    message:
                        "V8 trace did not contain guarded-stress boundaries"
                }
            ]
        });
    });
});
