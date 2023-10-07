import { useMemo } from "react";
import { EVT_RANGE, EVT_SCROLL_SIZE, EVT_ALL } from "@af-utils/virtual-core";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import type { VirtualScroller } from "@af-utils/virtual-core";

type On = Parameters<VirtualScroller["on"]>;

function getSingleEventHash(this: VirtualScroller, e: On[1][number]) {
    switch (e) {
        case EVT_RANGE:
            return this.to ** 2 + this.from; // szudzik pair
        case EVT_SCROLL_SIZE:
            return this.scrollSize;
        default:
            return this.sizesHash;
    }
}

const useComponentSubscription = (
    model: VirtualScroller,
    events: On[1] = EVT_ALL
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
