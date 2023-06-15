import type List from "models/VirtualScroller";

const mapVisibleRange = (
    model: List,
    cb: (index: number, delta: number) => JSX.Element,
    countOffset?: boolean
) => {
    const result: JSX.Element[] = [];
    let { from } = model;
    const { to } = model;

    if (countOffset) {
        for (let delta = model.getOffset(from); from < to; ) {
            result.push(cb(from, delta));
            delta += model.getSize(from++);
        }
    } else {
        while (from < to) {
            result.push(cb(from++, 0));
        }
    }

    return result;
};

export default mapVisibleRange;
