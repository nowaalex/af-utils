export const DEFAULT_OVERSCAN_COUNT = 3;
export const DEFAULT_ESTIMATED_WIDGET_SIZE = 200;
export const DEFAULT_ESTIMATED_ITEM_SIZE = 40;

export const SIZES_HASH_MODULO = 0x7fffffff;

/*
    0x7fffffff - maximum 32bit integer.
    Bitwise operations, used in fenwick tree, cannot be applied to numbers > int32.
*/
export const MAX_ITEM_COUNT = 0x7fffffff;

/** @internal */
export const enum InternalEvent {
    RANGE = 0,
    SCROLL_SIZE = 1,
    SIZES = 2
}

/**
 * @public
 * Possible events, supported by {@link VirtualScroller.on} method
 */
export const VirtualScrollerEvent = {
    /** {@link VirtualScroller.from} or {@link VirtualScroller.to} was changed */
    RANGE: 0,

    /** sum of all item sizes changed */
    SCROLL_SIZE: 1,

    /** at least one item size changed */
    SIZES: 2
} as const satisfies Record<string, InternalEvent>;

/**
 * @public
 * {@link (VirtualScrollerEvent:variable)} is exported as constant, so separate type is needed to emulate enum behavior
 */
export type VirtualScrollerEvent =
    (typeof VirtualScrollerEvent)[keyof typeof VirtualScrollerEvent];

/** @internal */
export const _ALL_EVENTS = [
    0, 1, 2
] as const satisfies readonly InternalEvent[];

/** @internal */
export const enum ScrollElementSizeKey {
    WINDOW_HORIZONTAL = "innerWidth",
    WINDOW_VERTICAL = "innerHeight",
    ELEMENT_HORIZONTAL = "offsetWidth",
    ELEMENT_VERTICAL = "offsetHeight"
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
