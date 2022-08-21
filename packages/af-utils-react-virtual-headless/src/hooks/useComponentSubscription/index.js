import { useCallback } from "react";
import { EVT_ALL, EVT_RANGE, EVT_SCROLL_SIZE, EVT_SIZES } from "constants";
import { useSyncExternalStore } from "use-sync-external-store/shim";

const useComponentSubscription = (model, events) => {
    events ||= EVT_ALL;

    const getHash = () =>
        events.reduce(
            (acc, e) =>
                "_" +
                acc +
                (e === EVT_RANGE
                    ? model.from + "_" + model.to
                    : e === EVT_SCROLL_SIZE
                    ? model.scrollSize
                    : model.sizesHash),
            ""
        );

    useSyncExternalStore(
        useCallback(listener => model.on(listener, events), [events]),
        getHash,
        getHash
    );
};

export default useComponentSubscription;
