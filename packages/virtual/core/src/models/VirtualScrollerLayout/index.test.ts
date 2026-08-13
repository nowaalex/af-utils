// @vitest-environment jsdom

import { expect, test, vi } from "vitest";
import TestResizeObserver from "../../__mocks__/ResizeObserver";
import VirtualScroller from "../VirtualScroller";
import VirtualScrollerLayout from ".";

globalThis.ResizeObserver = TestResizeObserver;

test("keeps paint containment on the viewport instead of virtual layers", () => {
    const vertical = new VirtualScroller({
        estimatedItemSize: 40,
        itemCount: 100_000
    });
    const verticalLayout = new VirtualScrollerLayout(vertical);
    const sizeElement = document.createElement("div");
    const itemsElement = document.createElement("div");
    verticalLayout.setSizeElement(sizeElement);
    verticalLayout.setItemsElement(itemsElement);

    expect(sizeElement.style.contain).toBe("size layout style");
    expect(sizeElement.style.overflow).toBe("hidden");
    expect(sizeElement.style.overflowAnchor).toBe("none");
    expect(sizeElement.style.height).toBe("4000000px");
    expect(sizeElement.style.zIndex).toBe("");
    expect(itemsElement.style.contain).toBe("size layout style");
    expect(itemsElement.style.top).toBe("0px");
    expect(itemsElement.style.transform).toBe("translate3d(0px, 0px, 0px)");
    expect(itemsElement.style.overflow).toBe("");

    const horizontal = new VirtualScroller({
        estimatedItemSize: 40,
        horizontal: true,
        itemCount: 100_000
    });
    const horizontalItemsElement = document.createElement("div");
    new VirtualScrollerLayout(horizontal).setItemsElement(
        horizontalItemsElement
    );

    expect(horizontalItemsElement.style.contain).toBe("size layout style");
    expect(horizontalItemsElement.style.left).toBe("0px");
    expect(horizontalItemsElement.style.transform).toBe(
        "translate3d(0px, 0px, 0px)"
    );
});

test("applies required scroller styles when attaching the model", () => {
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

    layout.setScrollerElement(scroller);

    expect(scroller.style.overflow).toBe("auto");
    expect(scroller.style.contain).toBe("strict");
    expect(model.from).toBeGreaterThan(0);

    scroller.style.overflow = "hidden";
    scroller.style.contain = "none";
    layout.setScrollerElement(scroller);
    expect(scroller.style.overflow).toBe("auto");
    expect(scroller.style.contain).toBe("strict");

    const setContainerSpy = vi.spyOn(model, "setContainer");
    const sizeElement = document.createElement("div");
    layout.setSizeElement(sizeElement);
    layout.setSizeElement(sizeElement);
    expect(setContainerSpy).toHaveBeenCalledOnce();

    layout.dispose();
});

test("publishes measured end geometry after the scroll transaction", () => {
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
    const sizeElement = document.createElement("div");
    const itemsElement = document.createElement("div");
    const layout = new VirtualScrollerLayout(model);

    model.setScroller(scroller);
    scroller.dispatchEvent(new Event("scroll"));
    layout.setSizeElement(sizeElement);
    layout.setItemsElement(itemsElement);

    const item = document.createElement("div");
    item.dataset.testSize = "80";
    model.attachItem(item, model.from);
    vi.advanceTimersByTime(0);

    expect(model.scrollSize).toBe(400);
    expect(sizeElement.style.height).toBe("400px");
    scroller.dispatchEvent(new Event("scrollend"));

    const rangeSize = model.getOffset(model.to) - model.getOffset(model.from);
    expect(model.scrollSize).toBe(440);
    expect(scroller.scrollTop).toBe(199);
    expect(sizeElement.style.height).toBe("440px");
    expect(itemsElement.style.height).toBe(`${rangeSize}px`);
    expect(itemsElement.style.transform).toBe(
        `translate3d(0px, ${model.getOffset(model.from)}px, 0px)`
    );

    model.detachItem(item);
    layout.dispose();
    model.setScroller(null);
    vi.useRealTimers();
});
