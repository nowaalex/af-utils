import { useLayoutEffect, useState } from "react";

import {
    EVT_SCROLL_SIZE,
    EVT_RANGE,
    EVT_SIZES,
    VirtualScroller
} from "@af-utils/virtual-core";

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

const useSyncedStyles = (model: VirtualScroller) => {
    const [outer, outerRef] = useState<HTMLElement | null>(null);
    const [inner, innerRef] = useState<HTMLElement | null>(null);

    useLayoutEffect(() => {
        if (outer && inner) {
            const unsubSize = model.on(() => {
                outer.style[model.horizontal ? "width" : "height"] =
                    model.scrollSize + "px";
            }, [EVT_SCROLL_SIZE]);

            const unsubScroll = model.on(() => {
                const fromOffset = model.getOffset(model.from);
                const toOffset = model.getOffset(model.to);
                inner.style.transform = `translate${
                    model.horizontal ? "X" : "Y"
                }(${fromOffset}px)`;
                inner.style[model.horizontal ? "width" : "height"] =
                    toOffset - fromOffset + "px";
            }, [EVT_RANGE, EVT_SIZES]);

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

            return () => {
                unsubSize();
                unsubScroll();
            };
        }
    }, [model, outer, inner]);

    return [outerRef, innerRef] as const;
};

export default useSyncedStyles;
