import {
    type VirtualScroller,
    VirtualScrollerEvent,
    type VirtualScrollerEventMask
} from "@af-utils/virtual-core";
import { useSyncExternalStore } from "preact/compat";
import { useCallback } from "preact/hooks";

/**
 * Re-render the current Preact component when selected model events publish.
 *
 * @returns The selected numeric model revision.
 * @public
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

    return useSyncExternalStore(subscribe, getSnapshot);
};

export default useVirtualSnapshot;
