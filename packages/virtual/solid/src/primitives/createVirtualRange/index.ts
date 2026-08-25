import {
    mapVirtualRange,
    type VirtualScroller,
    VirtualScrollerEvent
} from "@af-utils/virtual-core";
import { createMemo } from "solid-js";
import createVirtualSnapshot from "../createVirtualSnapshot";

/** Create a memoized accessor containing the currently rendered indexes. @public */
const createVirtualRange = (model: VirtualScroller) => {
    const revision = createVirtualSnapshot(model, VirtualScrollerEvent.RANGE);

    return createMemo(() => {
        revision();
        return mapVirtualRange(model, index => index);
    });
};

export default createVirtualRange;
