import { useCallback } from "react";
import { EVT_ALL } from "constants";
import { useSyncExternalStore } from "use-sync-external-store/shim";

/* TODO: dirty; based on evt constants. Maybe macro to evaluate build-time? */
const EVT_TO_PROP = ["from", "to", "scrollSize", "sizesHash"];

const useComponentSubscription = (model, events) => {
    events ||= EVT_ALL;

    /*
        Naive way is just to combine integers to string.
        But can do more optimal with low collision rate.

        TODO: test it
    */
    const getHash = () =>
        events.reduce((acc, e, i) => acc ^ (model[EVT_TO_PROP[e]] << i), 31);

    useSyncExternalStore(
        useCallback(listener => model.on(listener, events), [events]),
        getHash,
        getHash
    );
};

export default useComponentSubscription;
