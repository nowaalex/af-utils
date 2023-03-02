import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";
import List, { ScrollElement } from "models/List";

const useScroller = (model: List, scroller: ScrollElement) =>
    useIsomorphicLayoutEffect(() => {
        model.setScroller(scroller);
        return () => model.setScroller(null);
    }, [model, scroller]);

export default useScroller;
