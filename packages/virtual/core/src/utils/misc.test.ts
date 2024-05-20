import { expect, test } from "vitest";
import { growTypedArray } from "./misc";

test("growTypedArray util works", () => {
    const sourceArray = new Uint32Array([1, 2, 3]);
    const newArray = growTypedArray(sourceArray, 5, 10);

    expect(newArray).not.toEqual(sourceArray);
    expect(newArray).toEqual(new Uint32Array([1, 2, 3, 10, 10]));
});
