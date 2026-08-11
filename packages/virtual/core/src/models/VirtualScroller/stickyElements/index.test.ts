// @vitest-environment jsdom

import { describe, expect, test, vi } from "vitest";
import {
    horizontalAxisAdapter,
    verticalAxisAdapter
} from "../../../platform/axisAdapters";
import StickyElements, { type ResizeObserverFactory } from ".";

type TestElement = HTMLElement & { id: string };

const createElement = (id: string) => ({ id }) as TestElement;

const createEntry = (
    target: TestElement,
    blockSize: number,
    inlineSize = blockSize
) =>
    ({
        target,
        borderBoxSize: [{ blockSize, inlineSize }]
    }) as unknown as ResizeObserverEntry;

const createObserverHarness = () => {
    let callback: ResizeObserverCallback = () => {};
    const observe = vi.fn();
    const unobserve = vi.fn();
    const disconnect = vi.fn();
    const observer = {
        observe,
        unobserve,
        disconnect
    } as unknown as ResizeObserver;
    const factory: ResizeObserverFactory = nextCallback => {
        callback = nextCallback;
        return observer;
    };

    return {
        deliver(entries: readonly ResizeObserverEntry[]) {
            callback(entries, observer);
        },
        disconnect,
        factory,
        observe,
        unobserve
    };
};

describe("StickyElements", () => {
    test("tracks header and footer sizes as one aggregated resize", () => {
        const observer = createObserverHarness();
        const onSizeChange = vi.fn();
        const sticky = new StickyElements(
            verticalAxisAdapter,
            onSizeChange,
            observer.factory
        );
        const header = createElement("header");
        const footer = createElement("footer");

        sticky._setHeader(header);
        sticky._setFooter(footer);
        expect(observer.unobserve).not.toHaveBeenCalled();
        observer.deliver([createEntry(header, 30), createEntry(footer, 20)]);

        expect(sticky._headerSize).toBe(30);
        expect(sticky._footerSize).toBe(20);
        expect(sticky._totalSize).toBe(50);
        expect(onSizeChange).toHaveBeenCalledOnce();
        expect(onSizeChange).toHaveBeenCalledWith(50);

        onSizeChange.mockClear();
        observer.deliver([createEntry(header, 50)]);
        expect(sticky._headerSize).toBe(50);
        expect(sticky._totalSize).toBe(70);
        expect(onSizeChange).toHaveBeenCalledWith(20);
    });

    test("uses the configured axis when reading observer entries", () => {
        const observer = createObserverHarness();
        const onSizeChange = vi.fn();
        const sticky = new StickyElements(
            horizontalAxisAdapter,
            onSizeChange,
            observer.factory
        );
        const header = createElement("header");

        sticky._setHeader(header);
        observer.deliver([createEntry(header, 30, 70)]);

        expect(sticky._headerSize).toBe(70);
        expect(onSizeChange).toHaveBeenCalledWith(70);
    });

    test("removes the previous size and ignores its stale entries", () => {
        const observer = createObserverHarness();
        const onSizeChange = vi.fn();
        const sticky = new StickyElements(
            verticalAxisAdapter,
            onSizeChange,
            observer.factory
        );
        const header = createElement("header");

        sticky._setHeader(header);
        observer.deliver([createEntry(header, 40)]);
        onSizeChange.mockClear();

        sticky._setHeader(null);
        observer.deliver([createEntry(header, 80)]);

        expect(observer.unobserve).toHaveBeenCalledWith(header);
        expect(sticky._headerSize).toBe(0);
        expect(onSizeChange).toHaveBeenCalledOnce();
        expect(onSizeChange).toHaveBeenCalledWith(-40);
    });

    test("replaces an element and starts its size from zero", () => {
        const observer = createObserverHarness();
        const onSizeChange = vi.fn();
        const sticky = new StickyElements(
            verticalAxisAdapter,
            onSizeChange,
            observer.factory
        );
        const first = createElement("first");
        const second = createElement("second");

        sticky._setFooter(first);
        observer.deliver([createEntry(first, 25)]);
        onSizeChange.mockClear();

        sticky._setFooter(second);
        observer.deliver([createEntry(second, 15)]);

        expect(onSizeChange.mock.calls).toEqual([[-25], [15]]);
        expect(sticky._footerSize).toBe(15);
    });

    test("does not publish or observe while clearing an unmeasured element", () => {
        const observer = createObserverHarness();
        const onSizeChange = vi.fn();
        const sticky = new StickyElements(
            verticalAxisAdapter,
            onSizeChange,
            observer.factory
        );
        const header = createElement("header");

        sticky._setHeader(header);
        sticky._setHeader(null);

        expect(onSizeChange).not.toHaveBeenCalled();
        expect(observer.observe).toHaveBeenCalledTimes(1);
        expect(observer.observe).not.toHaveBeenCalledWith(null);
    });

    test("disconnects and clears both elements on dispose", () => {
        const observer = createObserverHarness();
        const onSizeChange = vi.fn();
        const sticky = new StickyElements(
            verticalAxisAdapter,
            onSizeChange,
            observer.factory
        );
        const header = createElement("header");
        const footer = createElement("footer");

        sticky._setHeader(header);
        sticky._setFooter(footer);
        observer.deliver([createEntry(header, 10), createEntry(footer, 20)]);
        onSizeChange.mockClear();
        sticky._dispose();

        expect(sticky._totalSize).toBe(0);
        expect(onSizeChange.mock.calls).toEqual([[-10], [-20]]);
        expect(observer.disconnect).toHaveBeenCalledOnce();
    });

    test("keeps native sticky positioning and restores its default z-index", () => {
        const observer = createObserverHarness();
        const sticky = new StickyElements(
            verticalAxisAdapter,
            vi.fn(),
            observer.factory
        );
        const header = document.createElement("div");
        const footer = document.createElement("div");
        header.style.position = "sticky";
        header.style.top = "4px";
        footer.style.position = "sticky";
        footer.style.bottom = "6px";
        footer.style.zIndex = "3";

        sticky._setHeader(header);
        sticky._setFooter(footer);

        expect(header.style.position).toBe("sticky");
        expect(header.style.top).toBe("4px");
        expect(header.style.zIndex).toBe("1");
        expect(footer.style.position).toBe("sticky");
        expect(footer.style.bottom).toBe("6px");
        expect(footer.style.zIndex).toBe("3");

        sticky._setHeader(null);
        sticky._setFooter(null);

        expect(header.style.position).toBe("sticky");
        expect(header.style.top).toBe("4px");
        expect(header.style.zIndex).toBe("");
        expect(footer.style.position).toBe("sticky");
        expect(footer.style.top).toBe("");
        expect(footer.style.bottom).toBe("6px");
        expect(footer.style.zIndex).toBe("3");
    });
});
