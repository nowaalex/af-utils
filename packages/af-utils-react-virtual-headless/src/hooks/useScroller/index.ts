import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";
import VirtualScroller from "models/VirtualScroller";
import type { ScrollElement } from "types";

const useScroller = (model: VirtualScroller, scroller: ScrollElement | null) =>
    useIsomorphicLayoutEffect(() => {
        model.setScroller(scroller);
        return () => model.setScroller(null);
    }, [model, scroller]);

export default useScroller;
