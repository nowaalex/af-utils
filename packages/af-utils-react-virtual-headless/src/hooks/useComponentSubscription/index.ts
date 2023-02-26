import { useMemo } from "react";
import { EVT_ALL, EVT_RANGE, EVT_SCROLL_SIZE } from "constants/";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import List from "models/List";

const useComponentSubscription = (model: List, events: Array<number>) => {
    events ||= EVT_ALL;

    // szudzik pair
    const [subscribe, getHash] = useMemo(
        () => [
            (listener: () => void) => model.on(listener, events),
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
