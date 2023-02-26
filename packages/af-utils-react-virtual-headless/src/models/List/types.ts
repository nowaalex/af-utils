export interface ListRuntimeParams {
    overscanCount?: number;
    horizontal?: boolean;
    itemCount?: number;
    estimatedItemSize?: number;
}

export interface ListInitialParams extends ListRuntimeParams {
    estimatedWidgetSize?: number;
}
