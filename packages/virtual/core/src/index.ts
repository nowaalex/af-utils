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
export { VirtualScrollerEvent } from "./constants";
export { VirtualScrollerError } from "./errors/VirtualScrollerError";
export { VirtualScrollerErrorCode } from "./errors/codes";
export { default as VirtualScroller } from "./models/VirtualScroller";
export { default as VirtualScrollerLayout } from "./models/VirtualScrollerLayout";
export type { VirtualScrollerLayoutStyle } from "./models/VirtualScrollerLayout";
export {
    mapVirtualRange,
    mapVirtualRangeWithOffset
} from "./utils/rangeMappers";

export type {
    VirtualScrollerExactPosition,
    VirtualScrollerScrollElement,
    VirtualScrollerInitialParams,
    VirtualScrollerRuntimeParams
} from "./types";
export type { VirtualScrollerEventMask } from "./constants";
