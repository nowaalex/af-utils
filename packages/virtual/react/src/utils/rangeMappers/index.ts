import type { VirtualScroller } from "@af-utils/virtual-core";

/**
 * @public
 * Map current visible items
 * @param model - {@link @af-utils/virtual-core#VirtualScroller} instance
 * @param cb - callback
 *
 * @returns Array of currently visible items
 */
export const mapVisibleRange = <T>(
    model: VirtualScroller,
    cb: (index: number) => T
) => {
    const result: T[] = [];

    for (let from = model.from, to = model.to; from < to; from++) {
        result.push(cb(from));
    }

    return result;
};

/**
 * @public
 * Map current visible items and provide offset for each item.
 *
 * @remarks
 * Used in scenarios, when each item is absolutely positioned
 *
 * @param model - {@link @af-utils/virtual-core#VirtualScroller} instance
 * @param cb - callback
 *
 * @returns Array of currently visible items
 */
export const mapVisibleRangeWithOffset = <T>(
    model: VirtualScroller,
    cb: (index: number, offset: number) => T
) => {
    const result: T[] = [];

    for (
        let from = model.from, to = model.to, delta = model.getOffset(from);
        from < to;
        delta += model.getSize(from), from++
    ) {
        result.push(cb(from, delta));
    }

    return result;
};
