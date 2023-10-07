import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";
import type { VirtualScroller } from "@af-utils/virtual-core";

const useScroller = (
    model: VirtualScroller,
    scroller: Parameters<VirtualScroller["setScroller"]>[0]
) =>
    useIsomorphicLayoutEffect(() => {
        model.setScroller(scroller);
        return () => model.setScroller(null);
    }, [model, scroller]);

export default useScroller;
