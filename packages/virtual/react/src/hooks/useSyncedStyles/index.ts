import { useState } from "react";
import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";
import { VirtualScrollerEvent, VirtualScroller } from "@af-utils/virtual-core";

const SIZE_PROVIDER_STYLE_BASE = {
    position: "relative",
    overflow: "hidden",
    contain: "strict",
    // otherwise may go above sticky header
    zIndex: -1
} as const;

const SIZE_PROVIDER_STYLE_HORIZONTAL = {
    ...SIZE_PROVIDER_STYLE_BASE,
    height: "100%"
} as const;

const SIZE_PROVIDER_STYLE_VERTICAL = {
    ...SIZE_PROVIDER_STYLE_BASE,
    width: "100%"
} as const;

const SCROLL_PROVIDER_STYLE_BASE = {
    position: "absolute",
    contain: "strict",
    overflow: "hidden",
    top: 0,
    left: 0
} as const;

const SCROLL_PROVIDER_STYLE_HORIZONTAL = {
    ...SCROLL_PROVIDER_STYLE_BASE,
    display: "flex",
    height: "100%"
} as const;

const SCROLL_PROVIDER_STYLE_VERTICAL = {
    ...SCROLL_PROVIDER_STYLE_BASE,
    display: "block",
    width: "100%"
} as const;

/**
 * @public
 * React hook.
 * Optimal CSS markup for virtual scroll is not intuitive.
 * Use this hook to avoid unneeded boilerplate.
 *
 * @returns Array of two callback refs (for outer and inner elements).
 *
 * @remarks
 * An example could be found {@link https://af-utils.com/virtual/examples/react/hook/simple | here}
 */
const useSyncedStyles = (
    model: VirtualScroller
): [
    (outerRef: HTMLElement | null) => void,
    (innerRef: HTMLElement | null) => void
] => {
    const [outer, outerRef] = useState<HTMLElement | null>(null);
    const [inner, innerRef] = useState<HTMLElement | null>(null);

    useIsomorphicLayoutEffect(() => {
        if (model && outer && inner) {
            const updateSizeStyle = () => {
                outer.style[model.horizontal ? "width" : "height"] =
                    model.scrollSize + "px";
            };

            const updateScrollStyle = () => {
                const fromOffset = model.getOffset(model.from);
                const toOffset = model.getOffset(model.to);
                inner.style.transform = `translate${
                    model.horizontal ? "X" : "Y"
                }(${fromOffset}px)`;
                inner.style[model.horizontal ? "width" : "height"] =
                    toOffset - fromOffset + "px";
            };

            const unsubSize = model.on(updateSizeStyle, [
                VirtualScrollerEvent.SCROLL_SIZE
            ]);

            const unsubScroll = model.on(updateScrollStyle, [
                VirtualScrollerEvent.RANGE,
                VirtualScrollerEvent.SIZES
            ]);

            Object.assign(
                outer.style,
                model.horizontal
                    ? SIZE_PROVIDER_STYLE_HORIZONTAL
                    : SIZE_PROVIDER_STYLE_VERTICAL
            );

            Object.assign(
                inner.style,
                model.horizontal
                    ? SCROLL_PROVIDER_STYLE_HORIZONTAL
                    : SCROLL_PROVIDER_STYLE_VERTICAL
            );

            updateSizeStyle();
            updateScrollStyle();

            return () => {
                unsubSize();
                unsubScroll();
            };
        }
    }, [model, outer, inner]);

    return [outerRef, innerRef];
};

export default useSyncedStyles;
