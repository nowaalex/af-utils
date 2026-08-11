// @vitest-environment jsdom

import { describe, expect, test } from "vitest";
import { horizontalAxisAdapter, verticalAxisAdapter } from ".";

const createEntry = (target: Element, blockSize: number, inlineSize: number) =>
    ({
        target,
        borderBoxSize: [{ blockSize, inlineSize }]
    }) as unknown as ResizeObserverEntry;

describe("axis adapters", () => {
    test("read vertical properties without dynamic property keys", () => {
        const element = document.createElement("div");
        Object.defineProperties(element, {
            scrollTop: { value: 125 },
            clientHeight: { value: 480 }
        });
        Object.defineProperties(window, {
            scrollY: { value: 250, configurable: true },
            innerHeight: { value: 900, configurable: true }
        });

        expect(verticalAxisAdapter._readElementOffset(element)).toBe(125);
        expect(verticalAxisAdapter._readElementSize(element)).toBe(480);
        expect(verticalAxisAdapter._readWindowOffset(window)).toBe(250);
        expect(verticalAxisAdapter._readWindowSize(window)).toBe(900);
        expect(
            verticalAxisAdapter._readEntrySize(createEntry(element, 50, 70))
        ).toBe(50);
    });

    test("read horizontal properties without dynamic property keys", () => {
        const element = document.createElement("div");
        Object.defineProperties(element, {
            scrollLeft: { value: 75 },
            clientWidth: { value: 640 }
        });
        Object.defineProperties(window, {
            scrollX: { value: 150, configurable: true },
            innerWidth: { value: 1_200, configurable: true }
        });

        expect(horizontalAxisAdapter._readElementOffset(element)).toBe(75);
        expect(horizontalAxisAdapter._readElementSize(element)).toBe(640);
        expect(horizontalAxisAdapter._readWindowOffset(window)).toBe(150);
        expect(horizontalAxisAdapter._readWindowSize(window)).toBe(1_200);
        expect(
            horizontalAxisAdapter._readEntrySize(createEntry(element, 50, 70))
        ).toBe(70);
    });
});
