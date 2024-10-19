import type { ReactNode, ElementType } from "react";
import type {
    VirtualScroller,
    VirtualScrollerEvent
} from "@af-utils/virtual-core";

/**
 * @public
 * Props passed to List item
 */
export interface ListItemProps {
    model: VirtualScroller;
    /** item index */
    i: number;
    /** links to {@link ListProps.itemData} */
    data?: any;
    offset?: number;
}

/**
 * @public
 * {@link List} component props
 */
export interface ListProps<C extends ElementType = "div"> {
    model: VirtualScroller;
    children: ElementType<ListItemProps>;
    /** could be accessed in {@link ListItemProps.data} */
    itemData?: any;
    getKey?: (index: number, itemData: any) => string | number;
    component?: C;
    header?: JSX.Element | null;
    footer?: JSX.Element | null;
}

/**
 * @public
 * {@link Subscription} component props
 */
export interface SubscriptionProps {
    model: VirtualScroller;
    children: () => ReactNode;
    events: readonly VirtualScrollerEvent[] | VirtualScrollerEvent[];
}
