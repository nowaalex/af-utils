import type { VirtualScroller } from "@af-utils/virtual-core";
import type {
    ComponentChildren,
    ComponentType,
    JSX,
    RefCallback
} from "preact";

/** Props passed to one Preact virtual-list item component. @public */
export interface ListItemProps<Data = unknown> {
    /** Model owning the rendered item range. */
    model: VirtualScroller;
    /** Current item index. */
    index: number;
    /** Data forwarded from {@link ListProps.itemData}. */
    data?: Data;
}

/** Props accepted by the Preact {@link List} component. @public */
export type ListProps<Data = unknown> = Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    "children" | "ref" | "style"
> & {
    /** Model owning list geometry and the rendered range. */
    model: VirtualScroller;
    /** Component used to render one virtual item. */
    children: ComponentType<ListItemProps<Data>>;
    /** Data forwarded to every rendered item. */
    itemData?: Data;
    /** Return a stable key for one item index. */
    getKey?: (index: number, itemData: Data) => string | number;
    /** Content rendered before the native scroll-size element. */
    header?: ComponentChildren;
    /** Content rendered after the native scroll-size element. */
    footer?: ComponentChildren;
    /** Inline style merged with the required scroller declarations. */
    style?: JSX.CSSProperties;
};

/** DOM refs and hydration-safe styles produced by {@link useVirtualLayout}. @public */
export interface VirtualPreactLayoutBinding {
    /** Attach the native element scroller. */
    scrollerRef: RefCallback<HTMLElement>;
    /** Attach the element contributing native scroll extent. */
    sizeRef: RefCallback<HTMLElement>;
    /** Attach the absolutely positioned rendered-range container. */
    itemsRef: RefCallback<HTMLElement>;
    /** Initial and interactive scroller style. */
    scrollerStyle: JSX.CSSProperties;
    /** Initial native scroll-size style. */
    sizeStyle: JSX.CSSProperties;
    /** Initial rendered-items geometry style. */
    itemsStyle: JSX.CSSProperties;
}
