import { useCallback } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import { EVT_ALL } from "constants";

/* TODO: dirty; based on evt constants. Maybe macro to evaluate build-time? */
const EVT_TO_PROP = ["from", "to", "scrollSize"];

const Subscription = ({ model, children, events = EVT_ALL }) => {
    const getHash = () =>
        events.reduce((acc, e) => `${acc}_${model[EVT_TO_PROP[e]]}`, "");

    useSyncExternalStore(
        useCallback(listener => model.on(listener, events), [events]),
        getHash,
        getHash
    );

    return children();
};

export default Subscription;
