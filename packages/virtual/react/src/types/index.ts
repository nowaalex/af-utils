import type { ReactNode, ElementType, ComponentProps } from "react";
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
    data?: any;
    offset?: number;
}

/**
 * @public
 * {@link List} component props
 */
export type ListProps<T extends ElementType = "div"> = Omit<
    ComponentProps<T>,
    "children" | "ref"
> & {
    model: VirtualScroller;
    children: ElementType<ListItemProps>;
    itemData?: ListItemProps["data"];
    getKey?: (
        index: number,
        itemData: ListItemProps["data"]
    ) => string | number;
    component?: T;
    header?: JSX.Element | null;
    footer?: JSX.Element | null;
};

/**
 * @public
 * {@link Subscription} component props
 */
export interface SubscriptionProps {
    model: VirtualScroller;
    children: () => ReactNode;
    events?: readonly VirtualScrollerEvent[] | VirtualScrollerEvent[];
}
