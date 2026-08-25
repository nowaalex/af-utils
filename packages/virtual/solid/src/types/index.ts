import type { VirtualScroller } from "@af-utils/virtual-core";
import type { Accessor, JSX } from "solid-js";

/** @public A static value or a reactive Solid accessor returning that value. */
export type MaybeAccessor<Value> = Value | Accessor<Value>;

/** @public Props passed to one Solid virtual-list item component. */
export interface ListItemProps<Data = unknown> {
    /** Model owning the rendered item range. */
    model: VirtualScroller;
    /** Reactive current item index. */
    index: Accessor<number>;
    /** Data forwarded from {@link ListProps.itemData}. */
    data?: Data;
}

/** @public Props accepted by the Solid `VirtualList` component. */
export type ListProps<Data = unknown> = Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    "children" | "ref" | "style"
> & {
    /** Model owning list geometry and the rendered range. */
    model: VirtualScroller;
    /** Fine-grained render function used for one virtual item. */
    children: (props: ListItemProps<Data>) => JSX.Element;
    /** Resolve stable item identities after records change index. */
    getItemKey?: (index: number) => string | number;
    /** Data forwarded to every rendered item. */
    itemData?: Data;
    /** Content rendered before the native scroll-size element. */
    header?: JSX.Element;
    /** Content rendered after the native scroll-size element. */
    footer?: JSX.Element;
    /** Inline presentation styles for the scroller. */
    style?: Readonly<Record<string, string | number | undefined>>;
};

/** @public DOM refs produced by `createVirtualLayout`. */
export interface VirtualLayoutBinding {
    /** Attach the [scroller element](/virtual/guides/layout-elements#scroller-ref). */
    scrollerRef: (element: HTMLElement) => void;
    /** Attach the [native size element](/virtual/guides/layout-elements#size-ref). */
    sizeRef: (element: HTMLElement) => void;
    /** Attach the [rendered-items element](/virtual/guides/layout-elements#items-ref). */
    itemsRef: (element: HTMLElement) => void;
}
