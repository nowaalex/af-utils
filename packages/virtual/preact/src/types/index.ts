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

/** Props accepted by the Preact `VirtualList` component. @public */
export type ListProps<Data = unknown> = Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    "children" | "ref" | "style"
> & {
    /** Model owning list geometry and the rendered range. */
    model: VirtualScroller;
    /** Component used to render one virtual item. */
    children: ComponentType<ListItemProps<Data>>;
    /** Resolve stable item identities after records change index. */
    getItemKey?: (index: number) => string | number;
    /** Data forwarded to every rendered item. */
    itemData?: Data;
    /** Content rendered before the native scroll-size element. */
    header?: ComponentChildren;
    /** Content rendered after the native scroll-size element. */
    footer?: ComponentChildren;
    /** Inline presentation styles for the scroller. */
    style?: JSX.CSSProperties;
};

/** DOM refs produced by {@link useVirtualLayout}. @public */
export interface VirtualPreactLayoutBinding {
    /** Attach the [scroller element](/virtual/guides/layout-elements#scroller-ref). */
    scrollerRef: RefCallback<HTMLElement>;
    /** Attach the [native size element](/virtual/guides/layout-elements#size-ref). */
    sizeRef: RefCallback<HTMLElement>;
    /** Attach the [rendered-items element](/virtual/guides/layout-elements#items-ref). */
    itemsRef: RefCallback<HTMLElement>;
}
