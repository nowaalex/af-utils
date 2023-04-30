import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";
import VirtualScroller, { ScrollElement } from "models/VirtualScroller";

const useScroller = (model: VirtualScroller, scroller: ScrollElement) =>
    useIsomorphicLayoutEffect(() => {
        model.setScroller(scroller);
        return () => model.setScroller(null);
    }, [model, scroller]);

export default useScroller;
