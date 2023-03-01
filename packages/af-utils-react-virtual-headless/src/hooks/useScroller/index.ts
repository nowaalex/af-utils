import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";
import type { PublicList, ScrollElement } from "models/List";

const useScroller = (model: PublicList, scroller: ScrollElement) =>
    useIsomorphicLayoutEffect(() => {
        model.setScroller(scroller);
        return () => model.setScroller(null);
    }, [model, scroller]);

export default useScroller;
