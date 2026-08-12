import {
    type VirtualScroller,
    VirtualScrollerEvent,
    type VirtualScrollerEventMask
} from "@af-utils/virtual-core";
import { useCallback, useSyncExternalStore } from "react";

/**
 * @public
 * Re-render the current component when selected model events are published.
 *
 * @returns The model revision used as the React external-store snapshot.
 */
const useVirtualSnapshot = (
    model: VirtualScroller,
    events: VirtualScrollerEventMask = VirtualScrollerEvent.RANGE
) => {
    const subscribe = useCallback(
        (callback: () => void) => model.subscribe(callback, events),
        [model, events]
    );
    const getSnapshot = useCallback(
        () => model.getRevision(events),
        [model, events]
    );

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

export default useVirtualSnapshot;
