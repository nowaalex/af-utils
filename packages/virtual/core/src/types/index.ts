/**
 * @public
 * Scrollable container type
 */
export type ScrollElement = HTMLElement | Window;

/**
 * @public
 * {@link VirtualScroller.set} argument type
 *
 * @remarks
 * Implemented as interface for better documentation output (api-extractor)
 */
export interface VirtualScrollerRuntimeParams {
    /**
     * Amount of items rendered before or after visible ones.
     * If scrolling is done forward - these items are rendered after visible ones.
     * If backward - before.
     */
    overscanCount?: number;
    /**
     * Total items quantity
     */
    itemCount?: number;
    /**
     * Estimated height/width of scrollable item. Orientation is determined by {@link VirtualScrollerInitialParams.horizontal}.
     *
     * @remarks
     * Actual size is always reported by `ResizeObserver`.
     * Bad item size assumptions can turn into shaky scrolling experience. Accuracy here is rewarded.
     */
    estimatedItemSize?: number;
}

/**
 * @public
 * {@link VirtualScroller} constructor argument type
 *
 * @remarks
 * Implemented as interface for better documentation output (api-extractor)
 */
export interface VirtualScrollerInitialParams
    extends VirtualScrollerRuntimeParams {
    /**
     * Container scroll orientation
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
     * Used is scenarios with different scroll/container elements
     */
    estimatedScrollElementOffset?: number;
}
