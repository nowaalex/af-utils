import { useEffect } from "react";
import List from "models/List";

const useSubscription = (
    model: List,
    events: Array<number>,
    callBack: () => void
) =>
    useEffect(() => {
        if (callBack) {
            callBack();
            return model.on(callBack, events);
        }
    }, [callBack, events]);

export default useSubscription;
