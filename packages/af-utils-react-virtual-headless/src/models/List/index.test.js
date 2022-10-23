import List from "./index";
import r from "lodash/random";
import clamp from "lodash/clamp";
/*
const ROWS_QUANTITY = 100;
const UPDATES_QUANTITY = 1;

const ROW_HEIGHTS = new Uint32Array(ROWS_QUANTITY);

const getOffsetUnoptimized = n => {
    let offset = 0;
    for (let j = 0; j < n; j++) {
        offset += ROW_HEIGHTS[j];
    }
    return offset;
};

const getIndexUnoptimized = offset => {
    let index = -1;

    do {
        offset -= ROW_HEIGHTS[++index];
    } while (offset >= 0);

    return index;
};*/

describe("List model works", () => {
    const VSList = new List({ estimatedWidgetSize: 12345 });

    test("Default params are ok", () => {
        expect(VSList._scrollPos).toEqual(0);
        expect(VSList._itemCount).toEqual(0);
        expect(VSList.from).toEqual(0);
        expect(VSList.to).toEqual(0);
        expect(VSList.scrollSize).toEqual(0);
        expect(VSList.sizesHash).toEqual(0);
    });

    test("Setting itemCount > max(int32) or < 0 throws error", () => {
        expect(() => VSList.set({ itemCount: 0x7fffffff + 1 })).toThrow();
    });

    test("Calcultions with zero itemCount work correctly", () => {
        expect(VSList.getIndex(0)).toEqual(0);
        expect(VSList.getOffset(0)).toEqual(0);
    });

    test("Default range is set correctly with 0 overscanCount", () => {
        VSList.set({ itemCount: 100, overscanCount: 0 });
        expect(VSList.scrollSize).toEqual(100 * VSList._estimatedItemSize);
        expect(VSList.from).toEqual(0);
        expect(VSList.to).toEqual(
            clamp(
                Math.ceil(
                    VSList._availableWidgetSize / VSList._estimatedItemSize
                ),
                1,
                VSList._itemCount
            )
        );
    });

    test("Overscan change with same itemCount does not lead to range change", () => {
        VSList.set({ itemCount: 100, overscanCount: 500 });
        expect(VSList.from).toEqual(0);
        expect(VSList.to).toEqual(
            clamp(
                Math.ceil(
                    VSList._availableWidgetSize / VSList._estimatedItemSize
                ),
                1,
                VSList._itemCount
            )
        );
    });

    test("Default range is set correctly with non-0 overscanCount", () => {
        VSList.set({ itemCount: 1000, overscanCount: 5 });
        expect(VSList.scrollSize).toEqual(
            VSList._itemCount * VSList._estimatedItemSize
        );
        expect(VSList.from).toEqual(0);
        expect(VSList.to).toEqual(
            clamp(
                5 +
                    Math.ceil(
                        VSList._availableWidgetSize / VSList._estimatedItemSize
                    ),
                1,
                VSList._itemCount
            )
        );
    });

    test("Adding initial elements works correctly", () => {
        for (let i = VSList.from; i < VSList.to; i++) {
            VSList.el(i, document.createElement("div"));
        }
    });
});
