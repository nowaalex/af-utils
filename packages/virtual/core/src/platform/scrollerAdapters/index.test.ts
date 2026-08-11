// @vitest-environment jsdom

import { describe, expect, test, vi } from "vitest";
import { verticalAxisAdapter } from "../axisAdapters";
import {
    createScrollerAdapter,
    ElementScrollerAdapter,
    WindowScrollerAdapter
} from ".";

describe("scroller adapters", () => {
    test("creates the adapter matching the target type", () => {
        expect(
            createScrollerAdapter(window, verticalAxisAdapter)
        ).toBeInstanceOf(WindowScrollerAdapter);
        expect(
            createScrollerAdapter(
                document.createElement("div"),
                verticalAxisAdapter
            )
        ).toBeInstanceOf(ElementScrollerAdapter);
    });

    test("element adapter calculates container distance", () => {
        const scroller = document.createElement("div");
        const container = document.createElement("div");

        Object.defineProperty(scroller, "scrollTop", { value: 30 });
        vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({
            top: 100
        } as DOMRect);
        vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
            top: 175
        } as DOMRect);

        const adapter = new ElementScrollerAdapter(
            scroller,
            verticalAxisAdapter
        );

        expect(adapter._distanceTo(container)).toBe(105);
        expect(adapter._distanceTo(scroller)).toBe(0);
    });

    test("observes pointer drags only in the native scrollbar gutter", () => {
        const scroller = document.createElement("div");
        Object.defineProperties(scroller, {
            clientLeft: { value: 0 },
            clientWidth: { value: 80 }
        });
        vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({
            left: 0,
            right: 100
        } as DOMRect);
        const adapter = new ElementScrollerAdapter(
            scroller,
            verticalAxisAdapter
        );
        const states: boolean[] = [];
        const unobserve = adapter._observePointerDrag(active =>
            states.push(active)
        );
        const pointerEvent = (type: string, clientX: number) => {
            const event = new Event(type);
            Object.defineProperties(event, {
                clientX: { value: clientX },
                isPrimary: { value: true }
            });
            return event;
        };

        scroller.dispatchEvent(pointerEvent("pointerdown", 40));
        window.dispatchEvent(pointerEvent("pointerup", 40));
        expect(states).toEqual([]);

        scroller.dispatchEvent(pointerEvent("pointerdown", 90));
        window.dispatchEvent(pointerEvent("pointerup", 90));
        expect(states).toEqual([true, false]);

        unobserve();
    });

    test("window adapter calculates container distance", () => {
        const container = document.createElement("div");
        Object.defineProperty(window, "scrollY", {
            value: 200,
            configurable: true
        });
        vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
            top: 75
        } as DOMRect);

        const adapter = new WindowScrollerAdapter(window, verticalAxisAdapter);

        expect(adapter._distanceTo(container)).toBe(275);
        expect(adapter._distanceTo(null)).toBe(0);
    });
});
