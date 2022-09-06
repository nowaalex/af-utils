import { useMemo } from "react";
import { EVT_ALL, EVT_RANGE, EVT_SCROLL_SIZE } from "constants";
import { useSyncExternalStore } from "use-sync-external-store/shim";

const useComponentSubscription = (model, events) => {
    events ||= EVT_ALL;

    // szudzik pair
    const [subscribe, getHash] = useMemo(
        () => [
            listener => model.on(listener, events),
            () =>
                events.reduce(
                    (acc, e) =>
                        acc +
                        "_" +
                        (e === EVT_RANGE
                            ? model.to ** 2 + model.from
                            : e === EVT_SCROLL_SIZE
                            ? model.scrollSize
                            : model.sizesHash),
                    ""
                )
        ],
        [events]
    );

    useSyncExternalStore(subscribe, getHash, getHash);
};

export default useComponentSubscription;
