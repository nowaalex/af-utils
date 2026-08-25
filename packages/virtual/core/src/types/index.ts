/**
 * @public
 * Scrollable container type
 */
export type VirtualScrollerScrollElement = HTMLElement | Window;

/**
 * @public
 * Numeric snapshot of scroll position
 *
 * @example
 * `5.3` stands for item at index `5` + `30%` of its size.
 *
 * Used to save/restore scroll position
 */
export type VirtualScrollerExactPosition = number;

/** @public Alignment used by {@link VirtualScroller.scrollToIndex}. */
export type VirtualScrollerScrollAlignment =
    | "start"
    | "center"
    | "end"
    | "auto";

/**
 * @public
 * Options accepted by {@link VirtualScroller.scrollToIndex}.
 */
export interface VirtualScrollerScrollToIndexOptions {
    /**
     * Position the item at the start, center, or end of the usable viewport.
     * `auto` avoids scrolling a fully visible item and otherwise uses the
     * nearest edge. Defaults to `start`.
     */
    align?: VirtualScrollerScrollAlignment;

    /** Native scrolling behavior. Defaults to `auto`. */
    behavior?: "auto" | "smooth";
}

/**
 * @public
 * {@link VirtualScroller} parameters that may change over time.
 * Used as {@link VirtualScroller.set} argument type.
 *
 * @remarks
 * Implemented as interface for better documentation output (api-extractor)
 */
export interface VirtualScrollerRuntimeParams {
    /**
     * Amount of items rendered before or after visible ones.
     *
     * @remarks
     * Render place depends on scroll direction:
     *
     * - if scrolling is done forward - these items are rendered after visible ones;
     *
     * - If backward - before.
     *
     * Changing only `overscanCount` does not invalidate the currently published
     * range. The new value is applied by the next natural range recalculation.
     */
    overscanCount?: number;

    /**
     * Total items quantity
     *
     * @remarks
     * Maximum supported value is `4_194_303` (`2^22 - 1`).
     * The dense size and Fenwick stores use roughly 16 bytes per item, so the
     * maximum consumes about 64 MiB before ordinary object and DOM overhead.
     * The bound also keeps bitwise Fenwick traversal inside the positive
     * signed 32-bit range.
     * But there is one more limit. W3C does not provide maximum allowed values for height, width, margin, etc.
     *
     * CSS theoretically supports infinite precision and infinite ranges for all value types;
     * however in reality implementations have finite capacity.
     * UAs should support reasonably useful ranges and precisions
     *
     * This quote was found {@link https://www.w3.org/TR/css3-values/#numeric-ranges | here}.
     * Chrome's experimentally found maximum value is `33_554_428`.
     * So some problems may happen if {@link VirtualScroller.scrollSize} is bigger.
     *
     * @privateRemarks
     * TODO: format remarks with blockquote when api-extractor starts supporting it
     */
    itemCount?: number;

    /**
     * Estimated height/width of scrollable item. Orientation is determined by {@link VirtualScrollerInitialParams.horizontal}.
     *
     * @remarks
     * Actual size is always reported by internal `ResizeObserver` when {@link VirtualScroller.attachItem} is called.
     * Bad item size assumptions can turn into shaky scrolling experience. Accuracy here is rewarded.
     *
     * Assigning a different `estimatedItemSize` through {@link VirtualScroller.set}
     * preserves cached sizes in the currently rendered `[from, to)` range and
     * resets cached sizes outside it to the new estimate. Consequently, an item
     * in that range which is still awaiting its first `ResizeObserver` delivery
     * can temporarily retain the previous estimate. When scrolling is idle,
     * the model corrects the native offset to preserve the current visible
     * anchor; an end-aligned viewport remains at the end.
     */
    estimatedItemSize?: number;
}

/**
 * @public
 * All {@link VirtualScroller} parameters (that may / may not change over time).
 *
 * @remarks
 * Implemented as interface for better documentation output (api-extractor)
 */
export interface VirtualScrollerInitialParams extends VirtualScrollerRuntimeParams {
    /**
     * Scroll container orientation.
     *
     * @remarks
     * Determines properties used for dimension/scroll calculations, for example:
     *
     * - `scrollTop` / `scrollLeft`;
     *
     * - `height` / `width`;
     *
     * - `innerHeight` / `innerWidth`.
     */
    horizontal?: boolean;

    /**
     * Estimated size of scroll element.
     *
     * @remarks
     * Actual size is always reported by `ResizeObserver`,
     * but this property together with {@link VirtualScrollerRuntimeParams.estimatedItemSize} and {@link VirtualScrollerRuntimeParams.overscanCount} can be used in server-side rendering.
     *
     * Quantity of SSR-rendered elements can be calculated this way:
     *
     * ```typescript
     * Math.min( itemCount, Math.ceil( estimatedWidgetSize / estimatedItemSize ) + overscanCount )
     * ```
     */
    estimatedWidgetSize?: number;

    /**
     * Estimated distance between top/left edges of scrollable container and first scrollable item.
     *
     * @remarks
     * Does not equal `0` only when scrollable container and items container are different elements.
     * {@link VirtualScroller.setContainer} has more explanation.
     */
    estimatedScrollElementOffset?: number;
}
