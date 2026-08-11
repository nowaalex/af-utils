import {
    useCallback,
    useMemo,
    useRef,
    type CSSProperties,
    type RefCallback
} from "react";
import {
    VirtualScrollerLayout,
    type VirtualScroller
} from "@af-utils/virtual-core";

/**
 * @public
 * Connect stable React refs to the framework-neutral virtual layout adapter.
 *
 * @returns Hydration-safe styles and refs for the scroller, scroll-size, and
 * rendered-items elements.
 */
const useVirtualLayout = (
    model: VirtualScroller,
    scrollerStyle: CSSProperties = {}
) => {
    const layout = useMemo(() => new VirtualScrollerLayout(model), [model]);
    const interactiveScrollerStyle = {
        overflow: "auto",
        contain: "strict",
        ...scrollerStyle
    } satisfies CSSProperties;
    const interactiveScrollerStyleRef = useRef(interactiveScrollerStyle);
    interactiveScrollerStyleRef.current = interactiveScrollerStyle;

    const scrollerRef = useCallback<RefCallback<HTMLElement>>(
        element => {
            layout.setScrollerElement(
                element,
                interactiveScrollerStyleRef.current as Record<
                    string,
                    string | number
                >
            );
            if (element) {
                return () => layout.setScrollerElement(null, {});
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
        itemsRef,
        scrollerStyle: layout.getScrollerElementStyle(
            interactiveScrollerStyle as Record<string, string | number>
        ) as CSSProperties,
        sizeStyle: layout.getSizeElementStyle() as CSSProperties,
        itemsStyle: layout.getItemsElementStyle() as CSSProperties
    };
};

export default useVirtualLayout;
