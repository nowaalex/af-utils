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
     */
    overscanCount?: number;

    /**
     * Total items quantity
     *
     * @remarks
     * Maximum suported value is `2_147_483_647` (int32 max).
     * This limit exists, because item sizes cache implementation has bitwise operations, which work only with int32.
     * But there is one more limit. W3C does not provide maximum allowed values for height, width, margin, etc.
     *
     * CSS theoretically supports infinite precision and infinite ranges for all value types;
     * however in reality implementations have finite capacity.
     * UAs should support reasonably useful ranges and precisions
     *
     * This quote was found {@link https://www.w3.org/TR/css3-values/#numeric-ranges | here}.
     * Chrome's experimentally found maximum value is `33_554_428`.
     * So some problems may happen if {@link @af-utils/virtual-core#VirtualScroller.scrollSize} is bigger.
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
export interface VirtualScrollerInitialParams
    extends VirtualScrollerRuntimeParams {
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
     * {@link @af-utils/virtual-core#VirtualScroller.setContainer} has more explanation.
     */
    estimatedScrollElementOffset?: number;
}
