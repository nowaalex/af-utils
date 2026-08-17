import { describe, expect, test } from "vitest";

import {
    checkV8Tier,
    classifyV8Tier,
    satisfiesRequestedV8Tier
} from "./check.js";

describe("V8 active-tier problem", () => {
    test("rejects an optimized function attached to the wrong tier", () => {
        const active = classifyV8Tier({
            maglev: true,
            turbofan: false,
            optimized: true
        });

        expect(active).toBe("maglev");
        expect(satisfiesRequestedV8Tier("turbofan", active)).toBe(false);
        expect(checkV8Tier("hot", "turbofan", active, 17)).toEqual({
            problemId: "v8-tier-mismatch",
            targetId: "hot",
            message:
                "hot requested turbofan, but active tier is maglev after guarded stress (status=17)"
        });
    });

    test("does not rename an unknown optimized tier", () => {
        const active = classifyV8Tier({
            maglev: false,
            turbofan: false,
            optimized: true
        });

        expect(active).toBe("other-optimized");
        expect(satisfiesRequestedV8Tier("maglev", active)).toBe(false);
        expect(satisfiesRequestedV8Tier("turbofan", active)).toBe(false);
    });

    test("accepts only the exact requested active tier", () => {
        expect(checkV8Tier("hot", "maglev", "maglev", 17)).toBeUndefined();
    });
});
