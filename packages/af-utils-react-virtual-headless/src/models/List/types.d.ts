export type ListRuntimeParams = {
    overscanCount?: number;
    horizontal?: boolean;
    itemCount?: number;
    estimatedItemSize?: number;
};

export type ListInitialParams = ListRuntimeParams & {
    estimatedWidgetSize?: number;
    estimatedScrollElementOffset?: number;
};
