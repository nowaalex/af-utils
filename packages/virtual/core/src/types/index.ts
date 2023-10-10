/**
 * @public
 * Scrollable container type
 */
export type ScrollElement = HTMLElement | Window;

/**
 * @public
 * {@link VirtualScroller.set} argument type
 */
export type VirtualScrollerRuntimeParams = {
    overscanCount?: number;
    itemCount?: number;
    estimatedItemSize?: number;
};

/**
 * @public
 * {@link VirtualScroller} constructor argument type
 */
export type VirtualScrollerInitialParams = VirtualScrollerRuntimeParams & {
    horizontal?: boolean;
    estimatedWidgetSize?: number;
    estimatedScrollElementOffset?: number;
};
