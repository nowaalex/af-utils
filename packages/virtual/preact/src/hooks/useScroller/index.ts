import type {
    VirtualScroller,
    VirtualScrollerScrollElement
} from "@af-utils/virtual-core";
import { useIsomorphicLayoutEffect } from "../useVirtual";

/** Synchronize a window or external scroller with a Preact-owned model. @public */
const useScroller = (
    model: VirtualScroller,
    scroller: VirtualScrollerScrollElement | null
) =>
    useIsomorphicLayoutEffect(() => {
        model.setScroller(scroller);
        return () => model.setScroller(null);
    }, [model, scroller]);

export default useScroller;
