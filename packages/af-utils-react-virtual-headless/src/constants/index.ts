export const DEFAULT_OVERSCAN_COUNT = 3;
export const DEFAULT_ESTIMATED_WIDGET_SIZE = 200;
export const DEFAULT_ESTIMATED_ITEM_SIZE = 40;

export const SIZES_HASH_MODULO = 2 ** 10 - 1;

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

export const enum SizeKey {
    HORIZONTAL = "offsetWidth",
    VERTICAL = "offsetHeight"
}

export const enum ScrollKey {
    HORIZONTAL_ = "scrollLeft",
    VERTICAL = "scrollTop"
}

export const enum ScrollToKey {
    HORIZONTAL = "left",
    VERTICAL = "top"
}

export const EVT_ALL = [Event.RANGE, Event.SCROLL_SIZE, Event.SIZES];
