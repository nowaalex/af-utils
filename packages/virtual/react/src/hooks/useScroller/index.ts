import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";
import type { ScrollElement, VirtualScroller } from "@af-utils/virtual-core";

/**
 * @public
 * React hook.
 * Synchronizes scroller with model. Should be used in window-scroll cases, otherwise `ref={model.setScroller}` is preferrable.
 */
const useScroller = (model: VirtualScroller, scroller: ScrollElement | null) =>
    useIsomorphicLayoutEffect(() => {
        model.setScroller(scroller);
        return () => model.setScroller(null);
    }, [model, scroller]);

export default useScroller;
