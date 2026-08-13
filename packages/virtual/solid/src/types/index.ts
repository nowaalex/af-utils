import type { VirtualScroller } from "@af-utils/virtual-core";
import type { Accessor, JSX } from "solid-js";

/** @public A static value or a reactive Solid accessor returning that value. */
export type MaybeAccessor<Value> = Value | Accessor<Value>;

/** @public Style declarations accepted by the Solid virtual list. */
export type VirtualSolidStyle = Readonly<
    Record<string, string | number | undefined>
>;

/** @public Callback suitable for a Solid HTMLElement `ref` attribute. */
export type VirtualElementRef = (element: HTMLElement) => void;

/** @public Props passed to one Solid virtual-list item component. */
export interface ListItemProps<Data = unknown> {
    /** Model owning the rendered item range. */
    model: VirtualScroller;
    /** Current item index. */
    index: number;
    /** Data forwarded from {@link ListProps.itemData}. */
    data?: Data;
}

/** @public Props accepted by the Solid {@link List} component. */
export type ListProps<Data = unknown> = Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    "children" | "ref" | "style"
> & {
    /** Model owning list geometry and the rendered range. */
    model: VirtualScroller;
    /** Fine-grained render function used for one virtual item. */
    children: (props: ListItemProps<Data>) => JSX.Element;
    /** Data forwarded to every rendered item. */
    itemData?: Data;
    /** Content rendered before the native scroll-size element. */
    header?: JSX.Element;
    /** Content rendered after the native scroll-size element. */
    footer?: JSX.Element;
    /** Inline presentation styles for the scroller. */
    style?: VirtualSolidStyle;
};

/** @public DOM refs produced by `createVirtualLayout`. */
export interface VirtualLayoutBinding {
    /** Attach the [scroller element](/virtual/guides/layout-elements#scroller-ref). */
    scrollerRef: VirtualElementRef;
    /** Attach the [native size element](/virtual/guides/layout-elements#size-ref). */
    sizeRef: VirtualElementRef;
    /** Attach the [rendered-items element](/virtual/guides/layout-elements#items-ref). */
    itemsRef: VirtualElementRef;
}
