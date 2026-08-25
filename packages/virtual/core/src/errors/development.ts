import {
    VirtualScrollerErrorCode,
    type VirtualScrollerErrorIndex
} from "./codes";
import { VirtualScrollerError } from "./VirtualScrollerError";

export { VirtualScrollerError } from "./VirtualScrollerError";

/** Numeric diagnostic arguments supplied only when an assertion fails. */
type MessageFactory = (
    first?: number,
    second?: number,
    third?: number,
    fourth?: number
) => string;

/** Format optional numeric diagnostic context. */
const describe = (value: number | undefined) =>
    value === undefined
        ? "undefined"
        : Number.isNaN(value)
          ? "NaN"
          : String(value);

/** Detailed messages indexed by the compact runtime error identifier. */
const messages: readonly MessageFactory[] = [
    (first, second) =>
        `Item index or exact position is outside the supported range. Received: ${describe(first)}, itemCount: ${describe(second)}.`,
    first => `Scroll offset must be finite. Received: ${describe(first)}.`,
    (first, second) =>
        `itemCount must be a safe integer between 0 and ${describe(second)}. Received: ${describe(first)}.`,
    first =>
        `estimatedItemSize must be a finite positive number. Received: ${describe(first)}.`,
    first =>
        `estimatedWidgetSize must be a finite non-negative number. Received: ${describe(first)}.`,
    first =>
        `estimatedScrollElementOffset must be finite. Received: ${describe(first)}.`,
    first =>
        `overscanCount must be a non-negative safe integer. Received: ${describe(first)}.`,
    () => 'scrollToIndex align must be "start", "center", "end", or "auto".',
    () => 'scrollToIndex behavior must be "auto" or "smooth".',
    (first, second, third, fourth) =>
        `Invalid collection splice for itemCount ${describe(fourth)}. Received: start=${describe(first)}, deleteCount=${describe(second)}, insertCount=${describe(third)}.`,
    (first, second, third) =>
        `Invalid item-size range. Expected 0 <= from <= to <= ${describe(third)}. Received: from=${describe(first)}, to=${describe(second)}.`,
    () => "The requested index operation requires at least one item.",
    () =>
        "This VirtualScroller has been disposed and can no longer be mutated or attached to DOM elements.",
    (first, second) =>
        `Cannot end an event batch at depth ${describe(second)}; expected at least ${describe(first)}.`
];

/** @internal */
export function assert(
    condition: boolean,
    code: VirtualScrollerErrorIndex
): asserts condition;

/**
 * Throw a compact package error with numeric diagnostic context.
 *
 * @remarks Numeric context is passed as individual arguments so successful
 * hot-path checks do not allocate an array. Development builds use it to
 * construct the detailed message only on the failing branch.
 * @internal
 */
export function assert(
    condition: boolean,
    code: VirtualScrollerErrorIndex,
    first: number | undefined,
    second?: number,
    third?: number,
    fourth?: number
): asserts condition;
export function assert(
    condition: boolean,
    code: VirtualScrollerErrorIndex,
    first?: number,
    second?: number,
    third?: number,
    fourth?: number
): asserts condition {
    if (!condition) {
        const publicCode = VirtualScrollerErrorCode[code];
        const error = new VirtualScrollerError(publicCode);
        error.message = `[${publicCode}] ${messages[code](first, second, third, fourth)}`;
        throw error;
    }
}
