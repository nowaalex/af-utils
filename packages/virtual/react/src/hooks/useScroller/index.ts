import type {
    VirtualScroller,
    VirtualScrollerScrollElement
} from "@af-utils/virtual-core";
import useIsomorphicLayoutEffect from "../useIsomorphicLayoutEffect";

/**
 * @public
 * React hook.
 * Synchronizes scroller with model.
 *
 * @remarks
 * Should be used in window-scroll cases, otherwise `ref={el => model.setScroller( el )}` is preferrable.
 */
const useScroller = (
    model: VirtualScroller,
    scroller: VirtualScrollerScrollElement | null
) =>
    useIsomorphicLayoutEffect(() => {
        model.setScroller(scroller);
        return () => model.setScroller(null);
    }, [model, scroller]);

export default useScroller;
