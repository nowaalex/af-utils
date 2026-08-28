import {
    type VirtualScroller,
    VirtualScrollerLayout
} from "@af-utils/virtual-core";
import { onCleanup } from "solid-js";
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
    onCleanup(() => layout.dispose());

    return {
        scrollerRef: element => {
            layout.setScrollerElement(element);
            onCleanup(() => layout.setScrollerElement(null));
        },
        sizeRef: element => {
            layout.setSizeElement(element);
            onCleanup(() => layout.setSizeElement(null));
        },
        itemsRef: element => {
            layout.setItemsElement(element);
            onCleanup(() => layout.setItemsElement(null));
        }
    };
};

export default createVirtualLayout;
