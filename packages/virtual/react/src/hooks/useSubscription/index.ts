import { useEffect } from "react";
import { VirtualScroller, VirtualScrollerEvent } from "@af-utils/virtual-core";

/**
 * @public
 * React hook.
 * Allows to subscribe to {@link @af-utils/virtual-core#(VirtualScrollerEvent:variable)} without unnecessary rerenders.
 *
 * @remarks
 * For example can be used in load-on-demand.
 *
 * @param model - {@link @af-utils/virtual-core#VirtualScroller} instance
 * @param events - array of {@link @af-utils/virtual-core#(VirtualScrollerEvent:variable)} to subscribe
 * @param callBack - callback to be called
 *
 * @privateRemarks
 * TODO: convert to arrow function when https://github.com/microsoft/rushstack/issues/1629 gets solved
 */
function useSubscription(
    model: VirtualScroller,
    events: readonly VirtualScrollerEvent[] | VirtualScrollerEvent[],
    callBack: () => void
) {
    useEffect(() => {
        if (callBack) {
            callBack();
            return model.on(callBack, events);
        }
    }, [model, callBack, events]);
}

export default useSubscription;
