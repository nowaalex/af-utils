import { useEffect } from "react";

const useSubscription = (model, events, callBack) =>
    useEffect(() => {
        if (callBack) {
            callBack();
            return model.on(callBack, events);
        }
    }, [callBack, events]);

export default useSubscription;
