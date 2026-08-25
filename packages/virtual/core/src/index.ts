/**
 * @packageDocumentation
 * {@inheritDoc VirtualScroller}
 */

export type { VirtualScrollerEventMask } from "./constants";
export { VirtualScrollerEvent } from "./constants";
export { VirtualScrollerErrorCode } from "./errors/codes";
export { VirtualScrollerError } from "./errors/VirtualScrollerError";
export { default as VirtualScroller } from "./models/VirtualScroller";
export { default as VirtualScrollerLayout } from "./models/VirtualScrollerLayout";

export type {
    VirtualScrollerExactPosition,
    VirtualScrollerInitialParams,
    VirtualScrollerRuntimeParams,
    VirtualScrollerScrollAlignment,
    VirtualScrollerScrollToIndexOptions,
    VirtualScrollerScrollElement
} from "./types";
export {
    mapVirtualRange,
    mapVirtualRangeWithOffset
} from "./utils/rangeMappers";
