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
export const VirtualScrollerEvent = {
    RANGE: 1,
    SCROLL_SIZE: 2,
    SIZES: 4,
    ALL: 7
} as const;

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
 * Fenwick tree indexes use signed 32-bit bitwise operations. Keeping the
 * capacity below 2^30 guarantees that index + lowestSetBit(index) stays
 * positive during tree traversal.
 *
 * @internal
 */
export const MAX_SIZE_INDEX_CAPACITY = 0x3fffffff;
