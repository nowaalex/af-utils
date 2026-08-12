import {
    type VirtualScroller,
    VirtualScrollerEvent,
    type VirtualScrollerEventMask
} from "@af-utils/virtual-core";
import { useEffect } from "preact/hooks";

/** Subscribe to model changes without scheduling a Preact render. @public */
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
