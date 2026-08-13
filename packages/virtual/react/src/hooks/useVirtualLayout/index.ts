import {
    assert,
    type VirtualScroller,
    VirtualScrollerLayout
} from "@af-utils/virtual-core";
import { type RefCallback, useCallback, useState } from "react";
import useIsomorphicLayoutEffect from "../useIsomorphicLayoutEffect";

/**
 * @public
 * Connect stable React refs to the framework-neutral virtual layout adapter.
 *
 * @returns Refs for the scroller, scroll-size, and rendered-items elements.
 */
const useVirtualLayout = (model: VirtualScroller) => {
    const [resource] = useState(() => ({
        layout: new VirtualScrollerLayout(model),
        model
    }));
    assert(resource.model === model, 13);
    const layout = resource.layout;
    useIsomorphicLayoutEffect(() => () => layout.dispose(), [layout]);

    const scrollerRef = useCallback<RefCallback<HTMLElement>>(
        element => {
            layout.setScrollerElement(element);
            if (element) {
                return () => layout.setScrollerElement(null);
            }
        },
        [layout]
    );

    const sizeRef = useCallback<RefCallback<HTMLElement>>(
        element => {
            layout.setSizeElement(element);
            if (element) {
                return () => layout.setSizeElement(null);
            }
        },
        [layout]
    );
    const itemsRef = useCallback<RefCallback<HTMLElement>>(
        element => {
            layout.setItemsElement(element);
            if (element) {
                return () => layout.setItemsElement(null);
            }
        },
        [layout]
    );

    return {
        scrollerRef,
        sizeRef,
        itemsRef
    };
};

export default useVirtualLayout;
