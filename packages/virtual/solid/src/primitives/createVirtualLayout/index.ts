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
 * @returns The three refs explained in the
 * [layout-elements guide](/virtual/guides/layout-elements).
 */
const createVirtualLayout = (model: VirtualScroller): VirtualLayoutBinding => {
    const layout = new VirtualScrollerLayout(model);
    let mounted = false;
    let scrollerElement: HTMLElement | null = null;
    let sizeElement: HTMLElement | null = null;
    let itemsElement: HTMLElement | null = null;

    onMount(() => {
        mounted = true;
        layout.setScrollerElement(scrollerElement);
        layout.setSizeElement(sizeElement);
        layout.setItemsElement(itemsElement);
    });
    onCleanup(() => layout.dispose());

    return {
        scrollerRef: element => {
            scrollerElement = element;
            if (mounted) layout.setScrollerElement(element);
            onCleanup(() => {
                if (scrollerElement !== element) return;
                scrollerElement = null;
                if (mounted) layout.setScrollerElement(null);
            });
        },
        sizeRef: element => {
            sizeElement = element;
            if (mounted) layout.setSizeElement(element);
            onCleanup(() => {
                if (sizeElement !== element) return;
                sizeElement = null;
                if (mounted) layout.setSizeElement(null);
            });
        },
        itemsRef: element => {
            itemsElement = element;
            if (mounted) layout.setItemsElement(element);
            onCleanup(() => {
                if (itemsElement !== element) return;
                itemsElement = null;
                if (mounted) layout.setItemsElement(null);
            });
        }
    };
};

export default createVirtualLayout;
