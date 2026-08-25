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

    test("matches only the target owned by each adapter", () => {
        const element = document.createElement("div");
        const otherElement = document.createElement("div");
        const elementAdapter = new ElementScrollerAdapter(
            element,
            verticalAxisAdapter
        );
        const windowAdapter = new WindowScrollerAdapter(
            window,
            verticalAxisAdapter
        );

        expect(elementAdapter._matchesTarget(element)).toBe(true);
        expect(elementAdapter._matchesTarget(otherElement)).toBe(false);
        expect(elementAdapter._matchesTarget(window)).toBe(false);
        expect(windowAdapter._matchesTarget(window)).toBe(true);
        expect(windowAdapter._matchesTarget(element)).toBe(false);
    });

    test("element adapter calculates container distance", () => {
        const scroller = document.createElement("div");
        const container = document.createElement("div");

        Object.defineProperties(scroller, {
            clientTop: { value: 5 },
            scrollTop: { value: 30 }
        });
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

        expect(adapter._distanceTo(container)).toBe(100);
        expect(adapter._distanceTo(scroller)).toBe(0);
    });

    test("element resize observation reports the client viewport", () => {
        const scroller = document.createElement("div");
        Object.defineProperty(scroller, "clientHeight", { value: 180 });
        let resizeCallback: ResizeObserverCallback | undefined;
        const disconnect = vi.fn();
        const observe = vi.fn();
        vi.stubGlobal(
            "ResizeObserver",
            class {
                constructor(callback: ResizeObserverCallback) {
                    resizeCallback = callback;
                }
                disconnect = disconnect;
                observe = observe;
            }
        );
        const callback = vi.fn();
        const adapter = new ElementScrollerAdapter(
            scroller,
            verticalAxisAdapter
        );
        const dispose = adapter._observeResize(callback);

        resizeCallback?.(
            [
                {
                    borderBoxSize: [{ blockSize: 200 }],
                    target: scroller
                } as ResizeObserverEntry
            ],
            {} as ResizeObserver
        );

        expect(observe).toHaveBeenCalledWith(scroller);
        expect(callback).toHaveBeenCalledWith(180);
        dispose();
        expect(disconnect).toHaveBeenCalledOnce();
        vi.unstubAllGlobals();
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

    test("element adapter releases pointer state in the owning window", () => {
        const pointerTarget = Object.assign(new EventTarget(), {
            ownerDocument: { defaultView: new EventTarget() }
        }) as unknown as HTMLElement;
        const owningWindow = pointerTarget.ownerDocument
            .defaultView as unknown as EventTarget;
        const start = vi.fn();
        const end = vi.fn();
        const adapter = new ElementScrollerAdapter(
            pointerTarget,
            verticalAxisAdapter
        );
        const dispose = adapter._observePointer(start, end);

        pointerTarget.dispatchEvent(new Event("pointerdown"));
        owningWindow.dispatchEvent(new Event("pointerup"));
        owningWindow.dispatchEvent(new Event("pointercancel"));

        expect(start).toHaveBeenCalledOnce();
        expect(end).toHaveBeenCalledTimes(2);

        dispose();
        pointerTarget.dispatchEvent(new Event("pointerdown"));
        owningWindow.dispatchEvent(new Event("pointerup"));
        expect(start).toHaveBeenCalledOnce();
        expect(end).toHaveBeenCalledTimes(2);
    });

    test("window adapter owns the complete pointer interaction", () => {
        const start = vi.fn();
        const end = vi.fn();
        const adapter = new WindowScrollerAdapter(window, verticalAxisAdapter);
        const dispose = adapter._observePointer(start, end);

        window.dispatchEvent(new Event("pointerdown"));
        window.dispatchEvent(new Event("pointerup"));

        expect(start).toHaveBeenCalledOnce();
        expect(end).toHaveBeenCalledOnce();

        dispose();
    });
});
