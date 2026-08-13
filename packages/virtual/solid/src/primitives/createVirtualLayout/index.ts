import {
    type VirtualScroller,
    VirtualScrollerLayout
} from "@af-utils/virtual-core";
import { onCleanup, onMount } from "solid-js";
import type { VirtualLayoutBinding } from "../../types";

/**
 * Connect Solid refs to the framework-neutral virtual DOM layout adapter.
 *
 * @public
 * @returns Refs for the scroller, scroll-size, and rendered-items elements.
 */
const createVirtualLayout = (model: VirtualScroller): VirtualLayoutBinding => {
    const layout = new VirtualScrollerLayout(model);
    let scrollerElement: HTMLElement | null = null;
    let sizeElement: HTMLElement | null = null;
    let itemsElement: HTMLElement | null = null;

    onMount(() => {
        layout.setScrollerElement(scrollerElement);
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
        }
    };
};

export default createVirtualLayout;
