/** @internal */
export const enum InternalEvent {
    RANGE = 0,
    SCROLL_SIZE = 1,
    SIZES = 2
}

/**
 * @public
 * Possible events, supported by {@link VirtualScroller.on} method
 *
 * @remarks
 * Events Description:
 *
 * - `RANGE`: {@link VirtualScroller.from} or {@link VirtualScroller.to} was changed;
 *
 * - `SCROLL_SIZE`: {@link VirtualScroller.scrollSize} was changed;
 *
 * - `SIZES`: at least one item size was changed. {@link VirtualScroller.sizesHash}.
 *
 * @privateRemarks
 * Did not export enum because I don't like reverse-mapped result in code.
 * Did not refer to InternalEvent because in this case api-extractor wants it to be exported.
 * Did not use enum modifier because api-extractor doesn't support it.
 * Used `Events Desctipton` just because list without header is rendered badly by api-documenter.
 */
export const VirtualScrollerEvent = {
    RANGE: 0,
    SCROLL_SIZE: 1,
    SIZES: 2
} as const satisfies Record<string, InternalEvent>;

/**
 * @public
 * {@link (VirtualScrollerEvent:variable)} is exported as constant, so separate type is needed to emulate enum behavior
 */
export type VirtualScrollerEvent =
    (typeof VirtualScrollerEvent)[keyof typeof VirtualScrollerEvent];

/** @internal */
export const enum WindowScrollElementSizeKey {
    WINDOW_HORIZONTAL = "innerWidth",
    WINDOW_VERTICAL = "innerHeight"
}

/** @internal */
export const enum ResizeObserverSizeKey {
    HORIZONTAL = "inlineSize",
    VERTICAL = "blockSize"
}

/** @internal */
export const enum ScrollKey {
    WINDOW_HORIZONTAL = "scrollX",
    WINDOW_VERTICAL = "scrollY",
    ELEMENT_HORIZONTAL = "scrollLeft",
    ELEMENT_VERTICAL = "scrollTop"
}

/** @internal */
export const enum ScrollToKey {
    HORIZONTAL = "left",
    VERTICAL = "top"
}
