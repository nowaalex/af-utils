import type { ReactNode, ElementType, ComponentProps } from "react";
import type { VirtualScroller } from "@af-utils/virtual-core";

export type SubscriptionProps = {
    model: VirtualScroller;
    children: () => ReactNode;
    events?: Parameters<VirtualScroller["on"]>[1];
};

export type ListItemProps = {
    model: VirtualScroller;
    i: number;
    data?: any;
    offset?: number;
};

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
