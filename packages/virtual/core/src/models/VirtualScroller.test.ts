// @vitest-environment jsdom

import { vi, describe, test, expect } from "vitest";
import VirtualScroller from "./VirtualScroller";
import TestResizeObserver from "__mocks__/ResizeObserver";

vi.useFakeTimers();

global.ResizeObserver = TestResizeObserver;

describe("VirtualScroller creation works", () => {
    test("constructor without params works", () => {
        const model = new VirtualScroller();

        expect(model.scrollSize).toBe(0);
        expect(model.from).toBe(0);
        expect(model.to).toBe(0);
    });

    test("constructor with params works", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 220,
            estimatedWidgetSize: 600,
            itemCount: 100,
            overscanCount: 0
        });
        expect(model.scrollSize).toBe(22000);
        expect(model.from).toBe(0);
        expect(model.to).toBe(3);
    });

    describe("sizes calculations work", () => {
        const pseudoRandomSizes = Array.from(
            { length: 256 },
            (_, i) => 45 + ((i ** 4) & 127)
        );

        const pseudoRandomSizesSum = pseudoRandomSizes.reduce(
            (acc, v) => acc + v
        );

        const model = new VirtualScroller({
            estimatedWidgetSize: pseudoRandomSizesSum,
            itemCount: pseudoRandomSizes.length
        });

        for (let i = 0; i < pseudoRandomSizes.length; i++) {
            const el = document.createElement("div");
            el.dataset.testSize = "" + pseudoRandomSizes[i];
            model.attachItem(el, i);
        }

        vi.runAllTimers();

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

        test.each(pseudoRandomSizes.map((_, i) => [i, getIndexNaive(i)]))(
            ".getIndex(%i)",
            (offset, expected) => {
                expect(model.getIndex(offset)).toBe(expected);
            }
        );
    });
});
