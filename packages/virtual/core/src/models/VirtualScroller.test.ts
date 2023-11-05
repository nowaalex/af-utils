import VirtualScroller from "./VirtualScroller";
import TestResizeObserver from "__mocks__/ResizeObserver";

jest.useFakeTimers();

global.ResizeObserver = TestResizeObserver;

describe("VirtualScroller creation works", () => {
    test("constructor without params works", () => {
        expect(() => new VirtualScroller()).not.toThrow();
    });

    test("constructor with params works", () => {
        expect(
            () =>
                new VirtualScroller({
                    estimatedWidgetSize: 200,
                    estimatedScrollElementOffset: 300
                })
        ).not.toThrow();
    });

    describe("sizes calculations work", () => {
        const pseudoRandomSizes = Array.from(
            { length: 512 },
            (_, i) => 45 + ((i ** 4) & 127)
        );

        const pseudoRandomSizesSum = pseudoRandomSizes.reduce(
            (acc, v) => acc + v
        );

        const model = new VirtualScroller({
            estimatedWidgetSize: pseudoRandomSizesSum
        });

        model.setItemCount(pseudoRandomSizes.length);

        for (let i = 0; i < pseudoRandomSizes.length; i++) {
            const el = document.createElement("div");
            el.dataset.testSize = "" + pseudoRandomSizes[i];
            model.el(i, el);
        }

        jest.runAllTimers();

        const getIndexNaive = (offset: number) => {
            let i = -1;

            do {
                offset -= model.getSize(++i);
            } while (offset > 0);

            return i;
        };

        const getOffsetNaive = (index: number) => {
            let offset = 0;

            for (let i = 0; i < index; i++) {
                offset += model.getSize(i);
            }

            return offset;
        };

        test("scrollSize works", () => {
            expect(model.scrollSize).toBe(pseudoRandomSizesSum);
        });

        test.each(pseudoRandomSizes.map((s, i) => [i, s]))(
            ".getSize(%i)",
            (index, expected) => {
                expect(model.getSize(index)).toBe(expected);
            }
        );

        test.each(pseudoRandomSizes.map((_, i) => [i, getOffsetNaive(i)]))(
            ".getOffset(%i)",
            (index, expected) => {
                expect(model.getOffset(index)).toBe(expected);
            }
        );

        test.each(
            Array.from(
                { length: Math.trunc(pseudoRandomSizesSum / 256) },
                (_, i) => [i * 256, getIndexNaive(i * 256)]
            )
        )(".getIndex(%i)", (offset, expected) => {
            expect(model.getIndex(offset)).toBe(expected);
        });
    });
});
