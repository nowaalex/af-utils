import {
    type VirtualScroller,
    VirtualScrollerEvent,
    type VirtualScrollerEventMask
} from "@af-utils/virtual-core";
import { createSignal, onCleanup } from "solid-js";

/**
 * Create a Solid accessor updated by selected model events.
 *
 * @public
 * @returns Accessor containing the current selected model revision.
 */
const createVirtualSnapshot = (
    model: VirtualScroller,
    events: VirtualScrollerEventMask = VirtualScrollerEvent.RANGE
) => {
    const [revision, setRevision] = createSignal(model.getRevision(events));
    const unsubscribe = model.subscribe(
        () => setRevision(model.getRevision(events)),
        events
    );

    onCleanup(unsubscribe);
    return revision;
};

export default createVirtualSnapshot;
