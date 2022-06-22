import { useEffect } from "react";
import { EMPTY_ARRAY } from "constants";

const useSubscription = (model, callBack, events, deps) =>
    useEffect(
        () => (callBack(), model.on(callBack, events)),
        deps || EMPTY_ARRAY
    );

export default useSubscription;
