import {
    assert,
    type VirtualScroller,
    VirtualScrollerLayout
} from "@af-utils/virtual-core";
import { type RefCallback, useCallback, useState } from "react";
import type { VirtualReactLayoutBinding } from "../../types";
import useIsomorphicLayoutEffect from "../useIsomorphicLayoutEffect";

/**
 * @public
 * Connect stable React refs to the framework-neutral virtual layout adapter.
 *
 * @returns The three refs explained in the
 * [layout-elements guide](/virtual/guides/layout-elements).
 */
const useVirtualLayout = (
    model: VirtualScroller
): VirtualReactLayoutBinding => {
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
