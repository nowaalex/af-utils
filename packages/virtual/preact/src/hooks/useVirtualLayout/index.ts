import {
    assert,
    type VirtualScroller,
    VirtualScrollerLayout
} from "@af-utils/virtual-core";
import type { JSX, RefCallback } from "preact";
import { useCallback, useRef, useState } from "preact/hooks";
import type { VirtualPreactLayoutBinding } from "../../types";
import { useIsomorphicLayoutEffect } from "../useVirtual";

/**
 * Connect stable Preact refs to the framework-neutral virtual layout adapter.
 *
 * @returns Hydration-safe styles and refs for all virtual layout elements.
 * @public
 */
const useVirtualLayout = (
    model: VirtualScroller,
    scrollerStyle: JSX.CSSProperties = {}
): VirtualPreactLayoutBinding => {
    const [resource] = useState(() => ({
        layout: new VirtualScrollerLayout(model),
        model
    }));
    assert(resource.model === model, 13);
    const layout = resource.layout;
    useIsomorphicLayoutEffect(() => () => layout.dispose(), [layout]);
    const interactiveStyle = {
        overflow: "auto",
        contain: "strict",
        ...scrollerStyle
    } satisfies JSX.CSSProperties;
    const interactiveStyleRef = useRef(interactiveStyle);
    interactiveStyleRef.current = interactiveStyle;

    const scrollerRef = useCallback<RefCallback<HTMLElement>>(
        element => {
            layout.setScrollerElement(
                element,
                interactiveStyleRef.current as Record<string, string | number>
            );
            if (element) return () => layout.setScrollerElement(null, {});
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
        itemsRef,
        scrollerStyle: layout.getScrollerElementStyle(
            interactiveStyle as Record<string, string | number>
        ) as JSX.CSSProperties,
        sizeStyle: layout.getSizeElementStyle() as JSX.CSSProperties,
        itemsStyle: layout.getItemsElementStyle() as JSX.CSSProperties
    };
};

export default useVirtualLayout;
