import {
    assert,
    type VirtualScroller,
    VirtualScrollerLayout
} from "@af-utils/virtual-core";
import type { RefCallback } from "preact";
import { useCallback, useState } from "preact/hooks";
import type { VirtualPreactLayoutBinding } from "../../types";
import { useIsomorphicLayoutEffect } from "../useVirtual";

/**
 * Connect stable Preact refs to the framework-neutral virtual layout adapter.
 *
 * @returns Refs for all virtual layout elements.
 * @public
 */
const useVirtualLayout = (
    model: VirtualScroller
): VirtualPreactLayoutBinding => {
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
            if (element) return () => layout.setScrollerElement(null);
        },
        [layout]
    );
    const sizeRef = useCallback<RefCallback<HTMLElement>>(
        element => {
            layout.setSizeElement(element);
            if (element) return () => layout.setSizeElement(null);
        },
        [layout]
    );
    const itemsRef = useCallback<RefCallback<HTMLElement>>(
        element => {
            layout.setItemsElement(element);
            if (element) return () => layout.setItemsElement(null);
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
