export const DEFAULT_OVERSCAN_COUNT = 3;
export const DEFAULT_ESTIMATED_WIDGET_SIZE = 200;
export const DEFAULT_ESTIMATED_ITEM_SIZE = 40;

export const SIZES_HASH_MODULO = 0x7fffffff;

/*
    0x7fffffff - maximum 32bit integer.
    Bitwise operations, used in fenwick tree, cannot be applied to numbers > int32.
*/
export const MAX_ITEM_COUNT = 0x7fffffff;

export const enum Event {
    RANGE = 0,
    SCROLL_SIZE = 1,
    SIZES = 2
}

export const enum ScrollElementSizeKey {
    WINDOW_HORIZONTAL = "innerWidth",
    WINDOW_VERTICAL = "innerHeight",
    ELEMENT_HORIZONTAL = "offsetWidth",
    ELEMENT_VERTICAL = "offsetHeight"
}

export const enum ResizeObserverSizeKey {
    HORIZONTAL = "inlineSize",
    VERTICAL = "blockSize"
}

export const enum ScrollKey {
    WINDOW_HORIZONTAL = "scrollX",
    WINDOW_VERTICAL = "scrollY",
    ELEMENT_HORIZONTAL = "scrollLeft",
    ELEMENT_VERTICAL = "scrollTop"
}

export const enum ScrollToKey {
    HORIZONTAL = "left",
    VERTICAL = "top"
}

export const EVT_ALL = [Event.RANGE, Event.SCROLL_SIZE, Event.SIZES];
