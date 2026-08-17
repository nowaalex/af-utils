import { describe, expect, test } from "vitest";

import { checkJscCompilation, classifyJscCompilation } from "./check.js";

describe("JavaScriptCore compilation problem", () => {
    test("labels DFG counters as historical rather than current-tier evidence", () => {
        expect(classifyJscCompilation(2)).toEqual({
            compiledHistorically: true,
            currentTier: "not-observable"
        });
    });

    test("reports missing DFG compilation and stress retries independently", () => {
        expect(checkJscCompilation("hot", 0, 1, 2)).toEqual([
            {
                problemId: "jsc-dfg-not-compiled",
                targetId: "hot",
                message: "hot was not compiled by JavaScriptCore DFG"
            },
            {
                problemId: "jsc-reoptimization-during-stress",
                targetId: "hot",
                message:
                    "hot increased its JavaScriptCore reoptimization retry count during stress"
            }
        ]);
    });

    test("accepts stable historical compilation", () => {
        expect(checkJscCompilation("hot", 1, 2, 2)).toEqual([]);
    });
});
