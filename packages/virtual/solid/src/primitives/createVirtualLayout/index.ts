import {
    type VirtualScroller,
    VirtualScrollerLayout,
    type VirtualScrollerLayoutStyle
} from "@af-utils/virtual-core";
import { onCleanup, onMount } from "solid-js";
import type { VirtualLayoutBinding, VirtualSolidStyle } from "../../types";

/** Convert a CSS property name to the DOM-style camel-case form. */
const toDOMProperty = (property: string) =>
    property.startsWith("--")
        ? property
        : property.replace(/-([a-z])/gu, (_, letter: string) =>
              letter.toUpperCase()
          );

/** Convert a DOM-style property name to serialized CSS syntax. */
const toCSSProperty = (property: string) =>
    property.startsWith("--")
        ? property
        : property.replace(/[A-Z]/gu, letter => `-${letter.toLowerCase()}`);

/** Remove undefined declarations and normalize names for DOM style access. */
const normalizeStyle = (style: VirtualSolidStyle): VirtualScrollerLayoutStyle =>
    Object.fromEntries(
        Object.entries(style)
            .filter(
                (entry): entry is [string, string | number] =>
                    entry[1] !== undefined
            )
            .map(([property, value]) => [toDOMProperty(property), value])
    );

/** Serialize one hydration-safe core layout style for Solid JSX. */
const serializeStyle = (style: VirtualScrollerLayoutStyle) =>
    Object.entries(style)
        .map(
            ([property, value]) => `${toCSSProperty(property)}:${String(value)}`
        )
        .join(";");

/**
 * Connect Solid refs to the framework-neutral virtual DOM layout adapter.
 *
 * @public
 * @returns Hydration-safe styles and refs for the scroller, scroll-size, and
 * rendered-items elements.
 */
const createVirtualLayout = (
    model: VirtualScroller,
    scrollerStyle: VirtualSolidStyle = {}
): VirtualLayoutBinding => {
    const layout = new VirtualScrollerLayout(model);
    let scrollerElement: HTMLElement | null = null;
    let sizeElement: HTMLElement | null = null;
    let itemsElement: HTMLElement | null = null;
    const interactiveStyle = normalizeStyle({
        overflow: "auto",
        contain: "strict",
        ...scrollerStyle
    });

    onMount(() => {
        layout.setScrollerElement(scrollerElement, interactiveStyle);
        layout.setSizeElement(sizeElement);
        layout.setItemsElement(itemsElement);
    });
    onCleanup(() => layout.dispose());

    return {
        scrollerRef: element => {
            scrollerElement = element;
        },
        sizeRef: element => {
            sizeElement = element;
        },
        itemsRef: element => {
            itemsElement = element;
        },
        scrollerStyle: serializeStyle(
            layout.getScrollerElementStyle(interactiveStyle)
        ),
        sizeStyle: serializeStyle(layout.getSizeElementStyle()),
        itemsStyle: serializeStyle(layout.getItemsElementStyle())
    };
};

export default createVirtualLayout;
