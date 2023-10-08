export const DEFAULT_OVERSCAN_COUNT = 3;
export const DEFAULT_ESTIMATED_WIDGET_SIZE = 200;
export const DEFAULT_ESTIMATED_ITEM_SIZE = 40;

export const SIZES_HASH_MODULO = 0x7fffffff;

/*
    0x7fffffff - maximum 32bit integer.
    Bitwise operations, used in fenwick tree, cannot be applied to numbers > int32.
*/
export const MAX_ITEM_COUNT = 0x7fffffff;

/** @ignore */
export const enum InternalEvent {
    RANGE = 0,
    SCROLL_SIZE = 1,
    SIZES = 2
}

/** @enum */
export const Event = {
    /** model.from or model.to changed */
    RANGE: 0,

    /** sum of item sizes changed */
    SCROLL_SIZE: 1,

    /** at least one item size changed */
    SIZES: 2
} as const satisfies Record<string, InternalEvent>;

export type Event = (typeof Event)[keyof typeof Event];

/** @ignore */
export const ALL_EVENTS = [
    InternalEvent.RANGE,
    InternalEvent.SCROLL_SIZE,
    InternalEvent.SIZES
] as const;

/** @ignore */
export const enum ScrollElementSizeKey {
    WINDOW_HORIZONTAL = "innerWidth",
    WINDOW_VERTICAL = "innerHeight",
    ELEMENT_HORIZONTAL = "offsetWidth",
    ELEMENT_VERTICAL = "offsetHeight"
}

/** @ignore */
export const enum ResizeObserverSizeKey {
    HORIZONTAL = "inlineSize",
    VERTICAL = "blockSize"
}

/** @ignore */
export const enum ScrollKey {
    WINDOW_HORIZONTAL = "scrollX",
    WINDOW_VERTICAL = "scrollY",
    ELEMENT_HORIZONTAL = "scrollLeft",
    ELEMENT_VERTICAL = "scrollTop"
}

/** @ignore */
export const enum ScrollToKey {
    HORIZONTAL = "left",
    VERTICAL = "top"
}
