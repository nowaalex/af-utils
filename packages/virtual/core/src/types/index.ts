export type ScrollElement = HTMLElement | Window;

export type VirtualScrollerRuntimeParams = {
    overscanCount?: number;
    itemCount?: number;
    estimatedItemSize?: number;
};

export type VirtualScrollerInitialParams = VirtualScrollerRuntimeParams & {
    horizontal?: boolean;
    estimatedWidgetSize?: number;
    estimatedScrollElementOffset?: number;
};
