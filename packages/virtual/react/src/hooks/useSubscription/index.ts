import { useEffect } from "react";
import type { VirtualScroller } from "@af-utils/virtual-core";

const useSubscription = (
    model: VirtualScroller,
    events: Parameters<VirtualScroller["on"]>[1],
    callBack: Parameters<VirtualScroller["on"]>[0]
) =>
    useEffect(() => {
        if (callBack) {
            callBack();
            return model.on(callBack, events);
        }
    }, [model, callBack, events]);

export default useSubscription;
