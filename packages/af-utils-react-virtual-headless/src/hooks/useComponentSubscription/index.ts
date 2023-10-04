import { useMemo } from "react";
import { EVT_ALL, Event } from "constants/";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import type VirtualScroller from "models/VirtualScroller";

const useComponentSubscription = (
    model: VirtualScroller,
    events: Event[] = EVT_ALL
) => {
    const [subscribe, getHash] = useMemo(
        () => [
            (listener: () => void) => model.on(listener, events),
            () =>
                events.reduce(
                    (acc, e) =>
                        acc +
                        "_" +
                        (e === Event.RANGE
                            ? model.to ** 2 + model.from // szudzik pair
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
