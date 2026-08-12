/**
 * @packageDocumentation
 * {@inheritDoc VirtualScroller}
 */

import { assert as assertInternal } from "#virtual-errors";

/**
 * Assert a condition using the active development or production error build.
 * @public
 */
export const assert: (condition: boolean, code: number) => asserts condition =
    assertInternal;
export type { VirtualScrollerEventMask } from "./constants";
export { VirtualScrollerEvent } from "./constants";
export { VirtualScrollerErrorCode } from "./errors/codes";
export { VirtualScrollerError } from "./errors/VirtualScrollerError";
export { default as VirtualScroller } from "./models/VirtualScroller";
export type { VirtualScrollerLayoutStyle } from "./models/VirtualScrollerLayout";
export { default as VirtualScrollerLayout } from "./models/VirtualScrollerLayout";

export type {
    VirtualScrollerExactPosition,
    VirtualScrollerInitialParams,
    VirtualScrollerRuntimeParams,
    VirtualScrollerScrollElement
} from "./types";
export {
    mapVirtualRange,
    mapVirtualRangeWithOffset
} from "./utils/rangeMappers";
