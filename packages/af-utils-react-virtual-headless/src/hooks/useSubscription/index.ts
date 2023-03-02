import { useEffect } from "react";
import { Event } from "constants/";
import type List from "models/List";

const useSubscription = (
    model: List,
    events: Array<Event>,
    callBack: () => void
) =>
    useEffect(() => {
        if (callBack) {
            callBack();
            return model.on(callBack, events);
        }
    }, [model, callBack, events]);

export default useSubscription;
