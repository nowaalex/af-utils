import type { VirtualScroller } from "@af-utils/virtual-core";
import type { Accessor, JSX } from "solid-js";

/** @public A static value or a reactive Solid accessor returning that value. */
export type MaybeAccessor<Value> = Value | Accessor<Value>;

/** @public Style declarations accepted by the Solid virtual layout adapter. */
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
    /** Inline style merged with the required scroller declarations. */
    style?: VirtualSolidStyle;
};

/** @public DOM refs and hydration-safe styles produced by `createVirtualLayout`. */
export interface VirtualLayoutBinding {
    /** Attach the native element scroller. */
    scrollerRef: VirtualElementRef;
    /** Attach the element contributing native scroll extent. */
    sizeRef: VirtualElementRef;
    /** Attach the absolutely positioned rendered-range container. */
    itemsRef: VirtualElementRef;
    /** Serialized initial scroller style for Solid SSR and hydration. */
    scrollerStyle: string;
    /** Serialized initial native scroll-size style. */
    sizeStyle: string;
    /** Serialized initial rendered-items geometry style. */
    itemsStyle: string;
}
