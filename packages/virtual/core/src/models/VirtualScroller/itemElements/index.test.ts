// @vitest-environment jsdom

import { describe, expect, test, vi } from "vitest";
import TestResizeObserver from "../../../__mocks__/ResizeObserver";
import ItemElements from ".";

globalThis.ResizeObserver = TestResizeObserver;

describe("ItemElements", () => {
    test("owns indexes and defers observations started by resize publication", () => {
        vi.useFakeTimers();
        const observe = vi.spyOn(TestResizeObserver.prototype, "observe");
        const first = document.createElement("div");
        const second = document.createElement("div");
        first.dataset.testSize = "60";
        second.dataset.testSize = "70";
        let items: ItemElements;
        const onResize = vi.fn(() => items._deferNewObservations());
        items = new ItemElements(onResize);

        try {
            items._attach(first, 4);
            expect(items._getIndex(first)).toBe(4);
            vi.advanceTimersByTime(0);

            items._attach(second, 5);
            expect(observe).toHaveBeenCalledTimes(1);
            items._detach(second);
            expect(items._getIndex(second)).toBeUndefined();

            vi.advanceTimersByTime(20);
            expect(observe).toHaveBeenCalledTimes(1);

            items._dispose();
            expect(items._getIndex(first)).toBeUndefined();
        } finally {
            items._dispose();
            observe.mockRestore();
            vi.useRealTimers();
        }
    });
});
