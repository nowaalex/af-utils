export const DEFAULT_OVERSCAN_COUNT = 3;
export const DEFAULT_ESTIMATED_WIDGET_SIZE = 200;

export const SIZES_HASH_MODULO = 2 ** 30 - 1;

/*
    0x7fffffff - maximum 32bit integer.
    Bitwise operations, used in fenwick tree, cannot be applied to numbers > int32.
*/
export const MAX_ITEM_COUNT = 0x7fffffff;

export const EVT_FROM = 0;
export const EVT_TO = 1;
export const EVT_SCROLL_SIZE = 2;
export const EVT_SIZES = 3;

export const EVT_ALL = [EVT_FROM, EVT_TO, EVT_SCROLL_SIZE, EVT_SIZES];
