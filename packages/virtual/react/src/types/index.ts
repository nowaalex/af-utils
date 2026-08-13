import type { VirtualScroller } from "@af-utils/virtual-core";
import type {
    ComponentType,
    ElementType,
    ReactElement,
    RefCallback
} from "react";

/**
 * @public
 * Props passed to List item
 */
export interface ListItemProps<Data = unknown> {
    model: VirtualScroller;
    /** item index */
    index: number;
    /** links to {@link ListProps.itemData} */
    data?: Data;
}

/**
 * @public
 * {@link List} component props
 */
export interface ListProps<C extends ElementType = "div", Data = unknown> {
    model: VirtualScroller;
    children: ComponentType<ListItemProps<Data>>;
    /** could be accessed in {@link ListItemProps.data} */
    itemData?: Data;
    getKey?: (index: number, itemData: Data) => string | number;
    component?: C;
    header?: ReactElement | null;
    footer?: ReactElement | null;
}

/** DOM refs produced by {@link useVirtualLayout}. @public */
export interface VirtualReactLayoutBinding {
    /** Attach the [scroller element](/virtual/guides/layout-elements#scroller-ref). */
    scrollerRef: RefCallback<HTMLElement>;
    /** Attach the [native size element](/virtual/guides/layout-elements#size-ref). */
    sizeRef: RefCallback<HTMLElement>;
    /** Attach the [rendered-items element](/virtual/guides/layout-elements#items-ref). */
    itemsRef: RefCallback<HTMLElement>;
}
