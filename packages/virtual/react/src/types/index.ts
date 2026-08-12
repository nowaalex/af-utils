import type { VirtualScroller } from "@af-utils/virtual-core";
import type { ComponentType, ElementType, ReactElement } from "react";

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
