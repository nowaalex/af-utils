import { useCallback } from "react";
import { EVT_ALL } from "constants";
import { useSyncExternalStore } from "use-sync-external-store/shim";

/*
    TODO: dirty; based on evt constants. Maybe macro to evaluate build-time?
    
    only 'to' is safe to use for EVT_RANGE, because from is never changed without 'to'
*/
const EVT_RANGE_PROP = ["to", "scrollSize", "sizesHash"];

const useComponentSubscription = (model, events) => {
    events ||= EVT_ALL;

    const getHash = () =>
        events.reduce((acc, e) => acc + model[EVT_RANGE_PROP[e]] + "_", "");

    useSyncExternalStore(
        useCallback(listener => model.on(listener, events), [events]),
        getHash,
        getHash
    );
};

export default useComponentSubscription;
