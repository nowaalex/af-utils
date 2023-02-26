import { useEffect } from "react";
import List from "models/List";
import { Event } from "constants/";

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
    }, [callBack, events]);

export default useSubscription;
