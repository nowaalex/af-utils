import { useEffect } from "react";
import {
    VirtualScrollerEvent,
    type VirtualScroller,
    type VirtualScrollerEventMask
} from "@af-utils/virtual-core";

/** @public Subscribe to model changes without scheduling a React render. */
const useVirtualEffect = (
    model: VirtualScroller,
    callback: () => void,
    events: VirtualScrollerEventMask = VirtualScrollerEvent.ALL
) =>
    useEffect(() => {
        callback();
        return model.subscribe(callback, events);
    }, [model, callback, events]);

export default useVirtualEffect;
