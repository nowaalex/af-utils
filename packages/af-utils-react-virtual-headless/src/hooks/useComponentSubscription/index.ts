import { useMemo } from "react";
import { EVT_ALL, Event } from "constants/";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import type List from "models/List";

const useComponentSubscription = (model: List, events: Array<Event>) => {
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
                        (e === Event.RANGE
                            ? model.to ** 2 + model.from
                            : e === Event.SCROLL_SIZE
                            ? model.scrollSize
                            : model.sizesHash),
                    ""
                )
        ],
        [model, events]
    );

    useSyncExternalStore(subscribe, getHash, getHash);
};

export default useComponentSubscription;
