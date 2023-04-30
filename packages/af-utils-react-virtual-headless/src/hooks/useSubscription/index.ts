import { useEffect } from "react";
import type { Event } from "constants/";
import type VirtualScroller from "models/VirtualScroller";

const useSubscription = (
    model: VirtualScroller,
    events: Event[],
    callBack: () => void
) =>
    useEffect(() => {
        if (callBack) {
            callBack();
            return model.on(callBack, events);
        }
    }, [model, callBack, events]);

export default useSubscription;
