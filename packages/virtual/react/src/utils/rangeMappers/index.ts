import type { VirtualScroller } from "@af-utils/virtual-core";

export const mapVisibleRange = (
    model: VirtualScroller,
    cb: (index: number) => JSX.Element
) => {
    const result: JSX.Element[] = [];

    for (let from = model.from, to = model.to; from < to; from++) {
        result.push(cb(from));
    }

    return result;
};

export const mapVisibleRangeWithOffset = (
    model: VirtualScroller,
    cb: (index: number, offset: number) => JSX.Element
) => {
    const result: JSX.Element[] = [];

    for (
        let from = model.from, to = model.to, delta = model.getOffset(from);
        from < to;
        from++, delta += model.getSize(from)
    ) {
        result.push(cb(from, delta));
    }

    return result;
};
