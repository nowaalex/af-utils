import { expect, test } from "vitest";
import { growTypedArray } from "./misc";
import { getLiftingLimit, getLiftingLimitNaive } from "./fTree";

const getLiftingLimit2 = (from: number, to: number) => {
    const vv = 1 << (32 - Math.clz32(from ^ to));
    return (from & -vv) | vv;
};

test("growTypedArray util works", () => {
    const sourceArray = new Float64Array([1, 2, 3]);
    const newArray = growTypedArray(sourceArray, 5, 10);

    expect(newArray).not.toEqual(sourceArray);
    expect(newArray).toEqual(new Float64Array([1, 2, 3, 10, 10]));
});

test.concurrent.each(Array.from({ length: 100 }, (_, i) => i))(
    "getLiftingLimit util works for range length %i",
    rangeLength => {
        for (let from = 0; from < 10000; from++) {
            const to = from + rangeLength;
            expect(getLiftingLimit(from, to), `[${from} - ${to}]`).toBe(
                getLiftingLimitNaive(from, to)
            );
        }
    }
);
