import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";
import type {
    VirtualScrollerScrollElement,
    VirtualScroller
} from "@af-utils/virtual-core";

/**
 * @public
 * React hook.
 * Synchronizes scroller with model.
 *
 * @remarks
 * Should be used in window-scroll cases, otherwise `ref={el => model.setScroller( el )}` is preferrable.
 *
 * @privateRemarks
 * TODO: convert to arrow function when https://github.com/microsoft/rushstack/issues/1629 gets solved
 */
function useScroller(
    model: VirtualScroller,
    scroller: VirtualScrollerScrollElement | null
) {
    useIsomorphicLayoutEffect(() => {
        model.setScroller(scroller);
        return () => model.setScroller(null);
    }, [model, scroller]);
}

export default useScroller;
