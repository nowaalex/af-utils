/** Inlined event flags used within the core package. @internal */
export const enum VirtualScrollerEventFlag {
    /** The rendered item range changed. */
    RANGE = 1 << 0,
    /** The published total item size changed. */
    SCROLL_SIZE = 1 << 1,
    /** At least one cached effective item size changed. */
    SIZES = 1 << 2,
    /** Every public virtual-scroller event. */
    ALL = RANGE | SCROLL_SIZE | SIZES
}

/**
 * @public
 * Bit flags accepted by {@link VirtualScroller.subscribe} and
 * {@link VirtualScroller.getRevision}.
 *
 * @remarks
 * - `RANGE`: {@link VirtualScroller.from} or {@link VirtualScroller.to} was changed;
 *
 * - `SCROLL_SIZE`: {@link VirtualScroller.scrollSize} was changed;
 *
 * - `SIZES`: at least one cached effective item size was changed.
 *
 * Flags can be combined without allocating an array:
 * `VirtualScrollerEvent.RANGE | VirtualScrollerEvent.SIZES`.
 */
export const VirtualScrollerEvent: {
    readonly RANGE: 1;
    readonly SCROLL_SIZE: 2;
    readonly SIZES: 4;
    readonly ALL: 7;
} = {
    RANGE: VirtualScrollerEventFlag.RANGE,
    SCROLL_SIZE: VirtualScrollerEventFlag.SCROLL_SIZE,
    SIZES: VirtualScrollerEventFlag.SIZES,
    ALL: VirtualScrollerEventFlag.ALL
};

/**
 * @public
 * `VirtualScrollerEvent` is exported as a constant, so a separate type is
 * needed to emulate enum behavior.
 */
export type VirtualScrollerEvent =
    | typeof VirtualScrollerEvent.RANGE
    | typeof VirtualScrollerEvent.SCROLL_SIZE
    | typeof VirtualScrollerEvent.SIZES;

/** @public */
export type VirtualScrollerEventMask = number;

/**
 * First allocation size for `SizeIndex` typed arrays.
 *
 * @remarks Small lists avoid repeated early reallocations while an empty model
 * still allocates nothing.
 * @internal
 */
export const MIN_SIZE_INDEX_CAPACITY = 64;

/**
 * Numerator of the `SizeIndex` geometric growth factor (`3 / 2`).
 * @internal
 */
export const SIZE_INDEX_GROWTH_NUMERATOR = 3;

/**
 * Denominator of the `SizeIndex` geometric growth factor (`3 / 2`).
 * @internal
 */
export const SIZE_INDEX_GROWTH_DENOMINATOR = 2;

/**
 * Largest logical item count supported by `SizeIndex`.
 *
 * @remarks
 * Two dense `Float64Array` stores use roughly 16 bytes per item. The limit
 * keeps their combined payload near 64 MiB while still allowing more than
 * four million virtual items. It also stays safely inside the signed 32-bit
 * range used by Fenwick-tree traversal.
 *
 * @internal
 */
export const MAX_SIZE_INDEX_CAPACITY = 0x3fffff;
