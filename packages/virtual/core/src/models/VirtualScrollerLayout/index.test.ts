// @vitest-environment jsdom

import { expect, test, vi } from "vitest";
import TestResizeObserver from "../../__mocks__/ResizeObserver";
import { VirtualScrollerEvent } from "../../constants";
import VirtualScroller from "../VirtualScroller";
import VirtualScrollerLayout from ".";

global.ResizeObserver = TestResizeObserver;

test("keeps paint containment on the viewport instead of virtual layers", () => {
    const vertical = new VirtualScroller({
        estimatedItemSize: 40,
        itemCount: 100_000
    });
    const verticalLayout = new VirtualScrollerLayout(vertical);
    const sizeStyle = verticalLayout.getSizeElementStyle();
    const itemsStyle = verticalLayout.getItemsElementStyle();

    expect(sizeStyle).toMatchObject({
        contain: "size layout style",
        overflow: "hidden",
        height: "4000000px"
    });
    expect(sizeStyle).not.toHaveProperty("zIndex");
    expect(itemsStyle).toMatchObject({
        contain: "size layout style",
        top: "0px",
        transform: "translate3d(0px, 0px, 0px)"
    });
    expect(itemsStyle).not.toHaveProperty("overflow");

    const horizontal = new VirtualScroller({
        estimatedItemSize: 40,
        horizontal: true,
        itemCount: 100_000
    });
    const horizontalItemsStyle = new VirtualScrollerLayout(
        horizontal
    ).getItemsElementStyle();

    expect(horizontalItemsStyle).toMatchObject({
        contain: "size layout style",
        left: "0px",
        transform: "translate3d(0px, 0px, 0px)"
    });
});

test("enables a hydration-safe scroller only after model attachment", () => {
    const model = new VirtualScroller({
        estimatedWidgetSize: 200,
        itemCount: 100
    });
    const scroller = Object.assign(document.createElement("div"), {
        scrollTop: 2_000,
        scroll({ top }: ScrollToOptions) {
            this.scrollTop = top ?? this.scrollTop;
        }
    });
    Object.defineProperty(scroller, "clientHeight", { value: 200 });
    const layout = new VirtualScrollerLayout(model);
    const interactiveStyle = {
        contain: "strict",
        overflow: "auto",
        overflowY: "scroll"
    } as const;

    expect(layout.getScrollerElementStyle(interactiveStyle)).toEqual({
        contain: "strict",
        overflow: "hidden"
    });

    layout.setScrollerElement(scroller, interactiveStyle);

    expect(scroller.style.overflow).toBe("auto");
    expect(scroller.style.overflowY).toBe("scroll");
    expect(model.from).toBeGreaterThan(0);
    expect(layout.getScrollerElementStyle(interactiveStyle)).toBe(
        interactiveStyle
    );

    layout.dispose();
});

test("bottom-aligns measured end items while native scroll size is frozen", () => {
    vi.useFakeTimers();
    const model = new VirtualScroller({
        estimatedItemSize: 40,
        estimatedWidgetSize: 200,
        itemCount: 10
    });
    const scroller = Object.assign(document.createElement("div"), {
        scrollTop: 199,
        scroll({ top }: ScrollToOptions) {
            this.scrollTop = top ?? this.scrollTop;
        }
    });
    Object.defineProperty(scroller, "clientHeight", { value: 200 });
    Object.defineProperties(scroller, {
        clientLeft: { value: 0 },
        clientWidth: { value: 80 }
    });
    vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({
        left: 0,
        right: 100
    } as DOMRect);
    const sizeElement = document.createElement("div");
    const itemsElement = document.createElement("div");
    const layout = new VirtualScrollerLayout(model);

    model.setScroller(scroller);
    scroller.dispatchEvent(new Event("scroll"));
    layout.setSizeElement(sizeElement);
    layout.setItemsElement(itemsElement);

    const pointerDown = new Event("pointerdown");
    Object.defineProperty(pointerDown, "isPrimary", { value: true });
    Object.defineProperty(pointerDown, "clientX", { value: 90 });
    scroller.dispatchEvent(pointerDown);

    const item = document.createElement("div");
    item.dataset.testSize = "80";
    model.attachItem(item, model.from);
    vi.advanceTimersByTime(0);

    const rangeSize = model.getOffset(model.to) - model.getOffset(model.from);
    expect(model.scrollSize).toBe(400);
    expect(itemsElement.style.height).toBe(`${rangeSize}px`);
    expect(itemsElement.style.top).toBe("0px");
    expect(itemsElement.style.transform).toBe(
        `translate3d(0px, ${model.scrollSize - rangeSize}px, 0px)`
    );

    const pointerUp = new Event("pointerup");
    Object.defineProperty(pointerUp, "isPrimary", { value: true });
    window.dispatchEvent(pointerUp);

    const internals = model as unknown as {
        _shouldAnchorRangeEnd(): boolean;
    };
    expect(internals._shouldAnchorRangeEnd()).toBe(false);
    expect(model.scrollSize).toBe(440);
    expect(scroller.scrollTop).toBe(240);
    expect(itemsElement.style.transform).toBe(
        `translate3d(0px, ${model.getOffset(model.from)}px, 0px)`
    );

    layout.dispose();
    model.setScroller(null);
    vi.useRealTimers();
});

test("expands a frozen end range backward until it fills the viewport", () => {
    vi.useFakeTimers();
    const model = new VirtualScroller({
        estimatedItemSize: 40,
        estimatedWidgetSize: 200,
        itemCount: 10
    });
    const scroller = Object.assign(document.createElement("div"), {
        scrollTop: 200,
        scroll({ top }: ScrollToOptions) {
            this.scrollTop = top ?? this.scrollTop;
        }
    });
    Object.defineProperties(scroller, {
        clientHeight: { value: 200 },
        clientLeft: { value: 0 },
        clientWidth: { value: 80 }
    });
    vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({
        left: 0,
        right: 100
    } as DOMRect);
    const itemsElement = document.createElement("div");
    const layout = new VirtualScrollerLayout(model);

    model.setScroller(scroller);
    scroller.dispatchEvent(new Event("scroll"));
    layout.setItemsElement(itemsElement);

    const pointerDown = new Event("pointerdown");
    Object.defineProperties(pointerDown, {
        clientX: { value: 90 },
        isPrimary: { value: true }
    });
    scroller.dispatchEvent(pointerDown);

    const measuredFrom = model.from;
    const renderedItems: HTMLElement[] = [];
    for (let index = model.from; index < model.to; index++) {
        const item = document.createElement("div");
        item.dataset.testSize = "20";
        renderedItems.push(item);
        model.attachItem(item, index);
    }
    vi.advanceTimersByTime(0);

    const rangeSize = model.getOffset(model.to) - model.getOffset(model.from);
    expect(model.from).toBeLessThan(measuredFrom);
    expect(rangeSize).toBeGreaterThanOrEqual(200);
    expect(itemsElement.style.transform).toBe(
        `translate3d(0px, ${model.scrollSize - rangeSize}px, 0px)`
    );

    const pointerUp = new Event("pointerup");
    Object.defineProperty(pointerUp, "isPrimary", { value: true });
    window.dispatchEvent(pointerUp);
    for (const item of renderedItems) model.detachItem(item);
    layout.dispose();
    model.setScroller(null);
    vi.useRealTimers();
});

test("bottom-aligns a frozen end range below a normal-flow sticky header", () => {
    vi.useFakeTimers();
    const model = new VirtualScroller({
        estimatedItemSize: 40,
        estimatedScrollElementOffset: 50,
        estimatedWidgetSize: 300,
        itemCount: 10
    });
    const scroller = Object.assign(document.createElement("div"), {
        scrollTop: 150,
        scroll({ top }: ScrollToOptions) {
            this.scrollTop = top ?? this.scrollTop;
        }
    });
    Object.defineProperties(scroller, {
        clientHeight: { value: 300 },
        clientLeft: { value: 0 },
        clientWidth: { value: 80 }
    });
    vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({
        left: 0,
        right: 100
    } as DOMRect);
    const header = document.createElement("div");
    header.dataset.testSize = "50";
    const itemsElement = document.createElement("div");
    const layout = new VirtualScrollerLayout(model);

    model.setScroller(scroller);
    model.setStickyHeader(header);
    vi.advanceTimersByTime(0);
    scroller.dispatchEvent(new Event("scroll"));
    layout.setItemsElement(itemsElement);

    const pointerDown = new Event("pointerdown");
    Object.defineProperties(pointerDown, {
        clientX: { value: 90 },
        isPrimary: { value: true }
    });
    scroller.dispatchEvent(pointerDown);

    const item = document.createElement("div");
    item.dataset.testSize = "80";
    model.attachItem(item, model.from);
    vi.advanceTimersByTime(0);

    const rangeSize = model.getOffset(model.to) - model.getOffset(model.from);
    expect(model.scrollSize).toBe(400);
    expect(itemsElement.style.transform).toBe(
        `translate3d(0px, ${model.scrollSize - rangeSize}px, 0px)`
    );

    const pointerUp = new Event("pointerup");
    Object.defineProperty(pointerUp, "isPrimary", { value: true });
    window.dispatchEvent(pointerUp);
    model.detachItem(item);
    model.setStickyHeader(null);
    layout.dispose();
    model.setScroller(null);
    vi.useRealTimers();
});

test("keeps the measured range at its logical offset before the scroll end", () => {
    vi.useFakeTimers();
    const model = new VirtualScroller({
        estimatedItemSize: 40,
        estimatedWidgetSize: 200,
        itemCount: 10
    });
    const scroller = Object.assign(document.createElement("div"), {
        scrollTop: 160,
        scroll({ top }: ScrollToOptions) {
            this.scrollTop = top ?? this.scrollTop;
        }
    });
    Object.defineProperties(scroller, {
        clientHeight: { value: 200 },
        clientLeft: { value: 0 },
        clientWidth: { value: 80 }
    });
    vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({
        left: 0,
        right: 100
    } as DOMRect);
    const itemsElement = document.createElement("div");
    const layout = new VirtualScrollerLayout(model);

    model.setScroller(scroller);
    scroller.dispatchEvent(new Event("scroll"));
    layout.setItemsElement(itemsElement);

    const pointerDown = new Event("pointerdown");
    Object.defineProperties(pointerDown, {
        clientX: { value: 90 },
        isPrimary: { value: true }
    });
    scroller.dispatchEvent(pointerDown);

    const item = document.createElement("div");
    item.dataset.testSize = "80";
    model.attachItem(item, model.from);
    vi.advanceTimersByTime(0);

    expect(model.to).toBe(model.itemCount);
    expect(
        (
            model as unknown as {
                _shouldAnchorRangeEnd(): boolean;
            }
        )._shouldAnchorRangeEnd()
    ).toBe(false);
    expect(itemsElement.style.transform).toBe(
        `translate3d(0px, ${model.getOffset(model.from)}px, 0px)`
    );

    const pointerUp = new Event("pointerup");
    Object.defineProperty(pointerUp, "isPrimary", { value: true });
    window.dispatchEvent(pointerUp);
    layout.dispose();
    model.setScroller(null);
    vi.useRealTimers();
});
