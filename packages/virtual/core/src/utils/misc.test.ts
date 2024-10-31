import { expect, test } from "vitest";
import { growTypedArray } from "./misc";
import { getLiftingLimit, getLiftingLimitNaive } from "./fTree";

test("growTypedArray util works", () => {
    const sourceArray = new Float64Array([1, 2, 3]);
    const newArray = growTypedArray(sourceArray, 5, 10);

    expect(newArray).not.toEqual(sourceArray);
    expect(newArray).toEqual(new Float64Array([1, 2, 3, 10, 10]));
});

test.concurrent.each(Array.from({ length: 60 }, (_, i) => i + 2))(
    "getLiftingLimit util works for range length %i",
    rangeLength => {
        for (let from = 0; from < 5000; from++) {
            const to = from + rangeLength;
            expect(getLiftingLimit(10000, from, to - 1)).toBe(
                getLiftingLimitNaive(10000, from, to)
            );
        }
    }
);
