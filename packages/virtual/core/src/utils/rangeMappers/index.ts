import type VirtualScroller from "../../models/VirtualScroller";

/**
 * Map the current rendered range without first allocating an indexes array.
 *
 * @public
 */
export const mapVirtualRange = <T>(
    model: VirtualScroller,
    callback: (index: number) => T
) => {
    const result: T[] = [];

    for (let index = model.from, to = model.to; index < to; index++) {
        result.push(callback(index));
    }

    return result;
};

/**
 * Map the current rendered range and provide the pixel offset of every item.
 *
 * @public
 */
export const mapVirtualRangeWithOffset = <T>(
    model: VirtualScroller,
    callback: (index: number, offset: number) => T
) => {
    const result: T[] = [];

    for (
        let index = model.from, to = model.to, offset = model.getOffset(index);
        index < to;
        offset += model.getSize(index), index++
    ) {
        result.push(callback(index, offset));
    }

    return result;
};
