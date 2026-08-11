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
    "AFV_INVALID_ATTEMPTS",
    "AFV_INVALID_SPLICE",
    "AFV_INVALID_RANGE",
    "AFV_EMPTY_MODEL",
    "AFV_DISPOSED",
    "AFV_BATCH_INVARIANT",
    "AFV_MODEL_CHANGED"
] as const;

/** Type of a stable machine-readable virtual-scroller error code. @public */
export type VirtualScrollerErrorCode =
    (typeof VirtualScrollerErrorCode)[number];

/** Compact indexes into {@link VirtualScrollerErrorCode}. @internal */
export const enum VirtualScrollerErrorIndex {
    INVALID_INDEX,
    INVALID_OFFSET,
    INVALID_ITEM_COUNT,
    INVALID_ITEM_SIZE,
    INVALID_WIDGET_SIZE,
    INVALID_SCROLLER_OFFSET,
    INVALID_OVERSCAN,
    INVALID_ATTEMPTS,
    INVALID_SPLICE,
    INVALID_RANGE,
    EMPTY_MODEL,
    DISPOSED,
    BATCH_INVARIANT,
    MODEL_CHANGED
}
