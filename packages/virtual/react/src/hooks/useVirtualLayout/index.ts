import {
    type VirtualScroller,
    VirtualScrollerLayout
} from "@af-utils/virtual-core";
import { type RefCallback, useCallback, useMemo } from "react";
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
    const layout = useMemo(() => new VirtualScrollerLayout(model), [model]);
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
