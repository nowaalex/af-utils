import {
    mapVirtualRange,
    VirtualScroller,
    VirtualScrollerEvent,
    type VirtualScrollerEventMask,
    type VirtualScrollerInitialParams,
    VirtualScrollerLayout
} from "@af-utils/virtual-core";
import { untrack } from "svelte";
import type { Attachment } from "svelte/attachments";

/** A static value or a getter containing that value. @public */
export type MaybeGetter<Value> = Value | (() => Value);

/**
 * Svelte attachments for the three elements explained in the
 * [layout-elements guide](/virtual/guides/layout-elements).
 *
 * @public
 */
export interface VirtualSvelteLayoutBinding {
    /** Attachment for the [scroller element](/virtual/guides/layout-elements#scroller-ref). */
    scroller: Attachment<HTMLElement>;
    /** Attachment for the [native size element](/virtual/guides/layout-elements#size-ref). */
    size: Attachment<HTMLElement>;
    /** Attachment for the [rendered-items element](/virtual/guides/layout-elements#items-ref). */
    items: Attachment<HTMLElement>;
}

/** Reactive range and layout attachments for a virtual list. @public */
export interface VirtualSvelteListBinding extends VirtualSvelteLayoutBinding {
    /** Component-owned virtual-scroller model. */
    model: VirtualScroller;
    /** Reactive array containing the currently rendered indexes. */
    range: () => number[];
}

/** Read a static value or invoke its getter. */
const readGetter = <Value>(value: MaybeGetter<Value>): Value =>
    typeof value === "function" ? (value as () => Value)() : value;

/**
 * Create a component-owned model and synchronize it with reactive parameters.
 *
 * @remarks Call this helper during Svelte component initialization.
 * @public
 */
export const createVirtual = (
    params: MaybeGetter<VirtualScrollerInitialParams>
) => {
    const model = new VirtualScroller(readGetter(params));

    $effect(() => {
        model.set(readGetter(params));
    });
    $effect(() => () => model.dispose());

    return model;
};

/**
 * Create a rune-backed numeric revision for selected model events.
 *
 * @public
 */
export const createVirtualSnapshot = (
    model: VirtualScroller,
    events: VirtualScrollerEventMask = VirtualScrollerEvent.RANGE
): (() => number) => {
    let revision = $state(model.getRevision(events));

    $effect(() => {
        revision = model.getRevision(events);
        return model.subscribe(() => {
            revision = model.getRevision(events);
        }, events);
    });

    return () => revision;
};

/** Create a reactive array containing the currently rendered indexes. @public */
export const createVirtualRange = (
    model: VirtualScroller
): (() => number[]) => {
    const snapshot = createVirtualSnapshot(model, VirtualScrollerEvent.RANGE);
    const range = $derived.by(() => {
        snapshot();
        return mapVirtualRange(model, index => index);
    });

    return () => range;
};

/**
 * Connect Svelte attachments to the framework-neutral virtual layout adapter.
 *
 * @remarks Call this helper during Svelte component initialization.
 * See the [layout-elements guide](/virtual/guides/layout-elements) for the
 * required nesting.
 * @public
 */
const createVirtualLayout = (
    model: VirtualScroller
): VirtualSvelteLayoutBinding => {
    const layout = new VirtualScrollerLayout(model);
    $effect(() => () => layout.dispose());

    return {
        scroller: element => {
            layout.setScrollerElement(element);
            return () => layout.setScrollerElement(null);
        },
        size: element => {
            layout.setSizeElement(element);
            return () => layout.setSizeElement(null);
        },
        items: element => {
            layout.setItemsElement(element);
            return () => layout.setItemsElement(null);
        }
    };
};

/**
 * Create the reactive range and attachments for the three
 * [layout elements](/virtual/guides/layout-elements).
 *
 * @public
 */
export const createVirtualList = (
    params: VirtualScroller | MaybeGetter<VirtualScrollerInitialParams>
): VirtualSvelteListBinding => {
    const model =
        params instanceof VirtualScroller ? params : createVirtual(params);

    return {
        model,
        ...createVirtualLayout(model),
        range: createVirtualRange(model)
    };
};

/** Create an attachment for an arbitrary scroller element. @public */
export const virtualScroller =
    (model: VirtualScroller): Attachment<HTMLElement> =>
    element => {
        model.setScroller(element);
        return () => model.setScroller(null);
    };

/** Create an attachment for an arbitrary rendered-item container. @public */
export const virtualContainer =
    (model: VirtualScroller): Attachment<HTMLElement> =>
    element => {
        model.setContainer(element);
        return () => model.setContainer(null);
    };

/** Create an attachment that observes one rendered virtual item. @public */
export const virtualItem =
    (
        model: VirtualScroller,
        index: MaybeGetter<number>
    ): Attachment<HTMLElement> =>
    element => {
        let currentIndex = untrack(() => readGetter(index));
        model.attachItem(element, currentIndex);

        if (typeof index === "function") {
            $effect(() => {
                const nextIndex = index();
                if (nextIndex === currentIndex) return;
                model.detachItem(element);
                currentIndex = nextIndex;
                model.attachItem(element, currentIndex);
            });
        }

        return () => model.detachItem(element);
    };

/** Create an attachment that observes row and column sizes for a grid cell. @public */
export const virtualGridItem =
    (
        rows: VirtualScroller,
        rowIndex: MaybeGetter<number>,
        columns: VirtualScroller,
        columnIndex: MaybeGetter<number>
    ): Attachment<HTMLElement> =>
    element => {
        let currentRowIndex = untrack(() => readGetter(rowIndex));
        let currentColumnIndex = untrack(() => readGetter(columnIndex));
        let attached = 0;
        const attach = () => {
            if (rows.from === currentRowIndex) {
                columns.attachItem(element, currentColumnIndex);
                attached |= 1;
            }
            if (columns.from === currentColumnIndex) {
                rows.attachItem(element, currentRowIndex);
                attached |= 2;
            }
        };
        const detach = () => {
            if (attached & 1) columns.detachItem(element);
            if (attached & 2) rows.detachItem(element);
            attached = 0;
        };

        attach();
        if (
            typeof rowIndex === "function" ||
            typeof columnIndex === "function"
        ) {
            $effect(() => {
                const nextRowIndex = readGetter(rowIndex);
                const nextColumnIndex = readGetter(columnIndex);
                if (
                    nextRowIndex === currentRowIndex &&
                    nextColumnIndex === currentColumnIndex
                ) {
                    return;
                }
                detach();
                currentRowIndex = nextRowIndex;
                currentColumnIndex = nextColumnIndex;
                attach();
            });
        }

        return detach;
    };

/** Create an attachment for the model's sticky header. @public */
export const virtualStickyHeader =
    (model: VirtualScroller): Attachment<HTMLElement> =>
    element => {
        model.setStickyHeader(element);
        return () => model.setStickyHeader(null);
    };

/** Create an attachment for the model's sticky footer. @public */
export const virtualStickyFooter =
    (model: VirtualScroller): Attachment<HTMLElement> =>
    element => {
        model.setStickyFooter(element);
        return () => model.setStickyFooter(null);
    };
