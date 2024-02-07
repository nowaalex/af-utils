import { useMemo } from "react";
import { VirtualScrollerEvent, VirtualScroller } from "@af-utils/virtual-core";
import { useSyncExternalStore } from "use-sync-external-store/shim/index.js";

function getSingleEventHash(this: VirtualScroller, e: VirtualScrollerEvent) {
    switch (e) {
        case VirtualScrollerEvent.RANGE:
            return this.to ** 2 + this.from; // szudzik pair
        case VirtualScrollerEvent.SCROLL_SIZE:
            return this.scrollSize;
        default:
            return this.sizesHash;
    }
}

/**
 * @public
 * React hook.
 * Rerenders component when one of {@link @af-utils/virtual-core#(VirtualScrollerEvent:variable)} gets emitted.
 * 
 * @remarks
 * Usually {@link Subscription} is a better alternative.
 * This hook might be used in {@link https://af-utils.vercel.app/virtual/react-examples/hook/grid | grid} scenario.
 *
 * @privateRemarks
 * TODO: convert to arrow function when https://github.com/microsoft/rushstack/issues/1629 gets solved
 */
function useComponentSubscription(
    model: VirtualScroller,
    events: readonly VirtualScrollerEvent[] | VirtualScrollerEvent[]
) {
    const [subscribe, getHash] = useMemo(
        () => [
            (listener: () => void) => model.on(listener, events),
            () => events.map(getSingleEventHash, model).join()
        ],
        [model, events]
    );

    useSyncExternalStore(subscribe, getHash, getHash);
}

export default useComponentSubscription;
