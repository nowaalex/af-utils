import { VirtualScrollerErrorCode, VirtualScrollerErrorIndex } from "./codes";
import { VirtualScrollerError } from "./VirtualScrollerError";

export { VirtualScrollerError } from "./VirtualScrollerError";

/** @internal */
export function assert(
    condition: boolean,
    code: VirtualScrollerErrorIndex
): asserts condition;

/** @internal */
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
    code: VirtualScrollerErrorIndex
): asserts condition {
    if (!condition) {
        throw new VirtualScrollerError(VirtualScrollerErrorCode[code]);
    }
}
