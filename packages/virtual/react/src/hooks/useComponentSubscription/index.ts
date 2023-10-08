import { useMemo } from "react";
import { Event, ALL_EVENTS } from "@af-utils/virtual-core";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import type { VirtualScroller } from "@af-utils/virtual-core";

type On = Parameters<VirtualScroller["on"]>;

function getSingleEventHash(this: VirtualScroller, e: On[1][number]) {
    switch (e) {
        case Event.RANGE:
            return this.to ** 2 + this.from; // szudzik pair
        case Event.SCROLL_SIZE:
            return this.scrollSize;
        default:
            return this.sizesHash;
    }
}

const useComponentSubscription = (
    model: VirtualScroller,
    events: On[1] = ALL_EVENTS
) => {
    const [subscribe, getHash] = useMemo(
        () => [
            (listener: On[0]) => model.on(listener, events),
            () => events.map(getSingleEventHash, model).join()
        ],
        [model, events]
    );

    useSyncExternalStore(subscribe, getHash, getHash);
};

export default useComponentSubscription;
