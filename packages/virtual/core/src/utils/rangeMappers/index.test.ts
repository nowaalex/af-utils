import { expect, test } from "vitest";
import TestResizeObserver from "../../__mocks__/ResizeObserver";
import VirtualScroller from "../../models/VirtualScroller";
import { mapVirtualRange, mapVirtualRangeWithOffset } from ".";

global.ResizeObserver = TestResizeObserver;

test("maps the current range without an intermediate indexes array", () => {
    const model = new VirtualScroller({
        estimatedItemSize: 10,
        estimatedWidgetSize: 40,
        itemCount: 4,
        overscanCount: 0
    });

    expect(mapVirtualRange(model, index => index)).toEqual([0, 1, 2, 3]);
    expect(
        mapVirtualRangeWithOffset(model, (index, offset) => [index, offset])
    ).toEqual([
        [0, 0],
        [1, 10],
        [2, 20],
        [3, 30]
    ]);
});
