import type { Locator } from "@playwright/test";
import { expect } from "./fixture";

export interface VirtualListState {
    endOffset: number;
    firstGap: number;
    firstPosition: number;
    itemCount: number;
    lastFullyVisible: boolean;
    lastGap: number;
    lastPosition: number;
    renderedCount: number;
}

export interface VirtualListStateOptions {
    footerSelector?: string;
    headerSelector?: string;
}

export interface ElementVisibilityOptions extends VirtualListStateOptions {
    containerSelector: string;
}

export const getVirtualItemCount = async (items: Locator) => {
    const itemCount = await items.evaluateAll(elements => {
        if (elements.length === 0) return 0;
        return Math.max(
            ...elements.map(element =>
                Number(element.getAttribute("aria-setsize"))
            )
        );
    });
    expect(itemCount).toBeGreaterThan(0);
    return itemCount;
};

export const getVirtualListState = (
    list: Locator,
    options: VirtualListStateOptions = {}
) =>
    list.evaluate((element, selectors) => {
        const items = [
            ...element.querySelectorAll<HTMLElement>('[role="listitem"]')
        ];
        const firstItem = items[0];
        const lastItem = items.at(-1);
        if (!firstItem || !lastItem) {
            throw new Error("Expected rendered virtual list items");
        }

        const viewport = element.getBoundingClientRect();
        const header = selectors.headerSelector
            ? element.querySelector(selectors.headerSelector)
            : null;
        const footer = selectors.footerSelector
            ? element.querySelector(selectors.footerSelector)
            : null;
        const contentTop = Math.max(
            viewport.top,
            header?.getBoundingClientRect().bottom ?? viewport.top
        );
        const contentBottom = Math.min(
            viewport.bottom,
            footer?.getBoundingClientRect().top ?? viewport.bottom
        );
        const firstBounds = firstItem.getBoundingClientRect();
        const lastBounds = lastItem.getBoundingClientRect();
        let visibleTop = Math.max(lastBounds.top, contentTop);
        let visibleBottom = Math.min(lastBounds.bottom, contentBottom);

        for (
            let ancestor = lastItem.parentElement;
            ancestor && ancestor !== element;
            ancestor = ancestor.parentElement
        ) {
            const { overflowY } = getComputedStyle(ancestor);
            if (
                overflowY === "hidden" ||
                overflowY === "clip" ||
                overflowY === "auto" ||
                overflowY === "scroll"
            ) {
                const clippingBounds = ancestor.getBoundingClientRect();
                visibleTop = Math.max(visibleTop, clippingBounds.top);
                visibleBottom = Math.min(visibleBottom, clippingBounds.bottom);
            }
        }

        return {
            endOffset: Math.max(
                0,
                element.scrollHeight - element.clientHeight - element.scrollTop
            ),
            firstGap: Math.max(0, firstBounds.top - contentTop),
            firstPosition: Number(firstItem.getAttribute("aria-posinset")),
            itemCount: Number(lastItem.getAttribute("aria-setsize")),
            lastFullyVisible:
                visibleTop <= lastBounds.top + 0.5 &&
                visibleBottom >= lastBounds.bottom - 0.5,
            lastGap: Math.max(0, contentBottom - lastBounds.bottom),
            lastPosition: Number(lastItem.getAttribute("aria-posinset")),
            renderedCount: items.length
        } satisfies VirtualListState;
    }, options);

const getBoxEdge = (
    bounds: { y: number; height: number },
    edge: "top" | "bottom"
) => bounds.y + (edge === "bottom" ? bounds.height : 0);

export const getBoundaryGap = async (
    item: Locator,
    boundary: Locator,
    itemEdge: "top" | "bottom",
    boundaryEdge: "top" | "bottom"
) => {
    const [itemBounds, boundaryBounds] = await Promise.all([
        item.boundingBox(),
        boundary.boundingBox()
    ]);

    return itemBounds && boundaryBounds
        ? Math.abs(
              getBoxEdge(itemBounds, itemEdge) -
                  getBoxEdge(boundaryBounds, boundaryEdge)
          )
        : Number.POSITIVE_INFINITY;
};

export const isElementFullyVisible = (
    item: Locator,
    options: ElementVisibilityOptions
) =>
    item.evaluate((element, selectors) => {
        const container = element.closest(selectors.containerSelector);
        if (!container) {
            throw new Error(
                `Expected an ancestor matching ${selectors.containerSelector}`
            );
        }

        const itemBounds = element.getBoundingClientRect();
        const containerBounds = container.getBoundingClientRect();
        const header = selectors.headerSelector
            ? container.querySelector(selectors.headerSelector)
            : null;
        const footer = selectors.footerSelector
            ? container.querySelector(selectors.footerSelector)
            : null;
        let visibleTop = Math.max(
            itemBounds.top,
            containerBounds.top,
            header?.getBoundingClientRect().bottom ?? containerBounds.top
        );
        let visibleBottom = Math.min(
            itemBounds.bottom,
            containerBounds.bottom,
            footer?.getBoundingClientRect().top ?? containerBounds.bottom
        );

        for (
            let ancestor = element.parentElement;
            ancestor && ancestor !== container;
            ancestor = ancestor.parentElement
        ) {
            const { overflowY } = getComputedStyle(ancestor);
            if (
                overflowY === "hidden" ||
                overflowY === "clip" ||
                overflowY === "auto" ||
                overflowY === "scroll"
            ) {
                const clippingBounds = ancestor.getBoundingClientRect();
                visibleTop = Math.max(visibleTop, clippingBounds.top);
                visibleBottom = Math.min(visibleBottom, clippingBounds.bottom);
            }
        }

        return (
            visibleTop <= itemBounds.top + 0.5 &&
            visibleBottom >= itemBounds.bottom - 0.5
        );
    }, options);
