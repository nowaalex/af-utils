/**
 * Stable machine-readable error codes emitted by the virtual-scroller packages.
 *
 * @remarks Array indexes are the compact runtime identifiers used internally.
 * @public
 */
export const VirtualScrollerErrorCode = [
    "AFV_INVALID_INDEX",
    "AFV_INVALID_OFFSET",
    "AFV_INVALID_ITEM_COUNT",
    "AFV_INVALID_ITEM_SIZE",
    "AFV_INVALID_WIDGET_SIZE",
    "AFV_INVALID_SCROLLER_OFFSET",
    "AFV_INVALID_OVERSCAN",
    "AFV_INVALID_SCROLL_ALIGNMENT",
    "AFV_INVALID_SCROLL_BEHAVIOR",
    "AFV_INVALID_SPLICE",
    "AFV_INVALID_RANGE",
    "AFV_EMPTY_MODEL",
    "AFV_DISPOSED",
    "AFV_BATCH_INVARIANT"
] as const;

/** Type of a stable machine-readable virtual-scroller error code. @public */
export type VirtualScrollerErrorCode =
    (typeof VirtualScrollerErrorCode)[number];

/** Compact indexes into {@link VirtualScrollerErrorCode}. @internal */
export enum VirtualScrollerErrorIndex {
    INVALID_INDEX = 0,
    INVALID_OFFSET = 1,
    INVALID_ITEM_COUNT = 2,
    INVALID_ITEM_SIZE = 3,
    INVALID_WIDGET_SIZE = 4,
    INVALID_SCROLLER_OFFSET = 5,
    INVALID_OVERSCAN = 6,
    INVALID_SCROLL_ALIGNMENT = 7,
    INVALID_SCROLL_BEHAVIOR = 8,
    INVALID_SPLICE = 9,
    INVALID_RANGE = 10,
    EMPTY_MODEL = 11,
    DISPOSED = 12,
    BATCH_INVARIANT = 13
}
