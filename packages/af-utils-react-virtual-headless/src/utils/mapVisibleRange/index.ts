import type List from "models/List";
import type { ReactElement } from "react";

const mapVisibleRange = (
    model: List,
    cb: (index: number, delta: number) => ReactElement,
    countOffset?: boolean
) => {
    const result: ReactElement[] = [];
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
