import { useEffect } from "react";
import { VirtualScroller, VirtualScrollerEvent } from "@af-utils/virtual-core";

/**
 * @public
 * React hook.
 * Allows to subscribe to {@link @af-utils/virtual-core#(VirtualScrollerEvent:variable)} without unnecessary rerenders.
 * For example can be used in load-on-demand.
 */
const useSubscription = (
    model: VirtualScroller,
    events: readonly VirtualScrollerEvent[] | VirtualScrollerEvent[],
    callBack: () => void
) =>
    useEffect(() => {
        if (callBack) {
            callBack();
            return model.on(callBack, events);
        }
    }, [model, callBack, events]);

export default useSubscription;
