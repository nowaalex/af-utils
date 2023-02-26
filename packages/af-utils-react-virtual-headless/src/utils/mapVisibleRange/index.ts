import List from "models/List";
import type { ReactNode } from "react";

const mapVisibleRange = (
    model: List,
    cb: (index: number, delta: number) => ReactNode,
    countOffset?: boolean
) => {
    const result = [];
    let { from, to } = model;

    if (countOffset) {
        for (let delta = model.getOffset(from); from < to; ) {
            result.push(cb(from, delta));
            delta += model.getSize(from++);
        }
    } else {
        for (; from < to; ) {
            result.push(cb(from++, 0));
        }
    }

    return result;
};

export default mapVisibleRange;
