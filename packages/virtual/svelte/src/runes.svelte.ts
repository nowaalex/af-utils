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

/** Rune-backed reactive value exposed by the Svelte adapter. @public */
export interface VirtualSvelteValue<Value> {
    /** Current reactive value. */
    readonly current: Value;
}

/** Parameters accepted by the {@link virtualItem} attachment. @public */
export interface VirtualSvelteItemBinding {
    /** Model that observes the item. */
    model: VirtualScroller;
    /** Current item index. */
    index: number;
}

/** Parameters accepted by the {@link virtualGridItem} attachment. @public */
export interface VirtualSvelteGridItemBinding {
    /** Model owning virtual rows. */
    rows: VirtualScroller;
    /** Current row index. */
    rowIndex: number;
    /** Model owning virtual columns. */
    columns: VirtualScroller;
    /** Current column index. */
    columnIndex: number;
}

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
    /** Reactive array containing the currently rendered indexes. */
    range: VirtualSvelteValue<number[]>;
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
    let initialized = false;

    $effect(() => {
        const nextParams = readGetter(params);
        if (initialized) model.set(nextParams);
        else initialized = true;
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
): VirtualSvelteValue<number> => {
    let revision = $state(model.getRevision(events));

    $effect(() => {
        revision = model.getRevision(events);
        return model.subscribe(() => {
            revision = model.getRevision(events);
        }, events);
    });

    return {
        /** Return the current reactive model revision. */
        get current() {
            return revision;
        }
    };
};

/** Create a reactive array containing the currently rendered indexes. @public */
export const createVirtualRange = (
    model: VirtualScroller
): VirtualSvelteValue<number[]> => {
    const snapshot = createVirtualSnapshot(model, VirtualScrollerEvent.RANGE);

    return {
        /** Map the currently rendered indexes after the latest range event. */
        get current() {
            void snapshot.current;
            return mapVirtualRange(model, index => index);
        }
    };
};

/**
 * Connect Svelte attachments to the framework-neutral virtual layout adapter.
 *
 * @remarks Call this helper during Svelte component initialization.
 * See the [layout-elements guide](/virtual/guides/layout-elements) for the
 * required nesting.
 * @public
 */
export const createVirtualLayout = (
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
    model: VirtualScroller
): VirtualSvelteListBinding => ({
    ...createVirtualLayout(model),
    range: createVirtualRange(model)
});

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
    (binding: MaybeGetter<VirtualSvelteItemBinding>): Attachment<HTMLElement> =>
    element => {
        let current = untrack(() => readGetter(binding));
        current.model.attachItem(element, current.index);

        if (typeof binding === "function") {
            $effect(() => {
                const next = binding();
                if (
                    next.model === current.model &&
                    next.index === current.index
                ) {
                    return;
                }
                current.model.detachItem(element);
                current = next;
                current.model.attachItem(element, current.index);
            });
        }

        return () => current.model.detachItem(element);
    };

/** Create an attachment that observes row and column sizes for a grid cell. @public */
export const virtualGridItem =
    (
        binding: MaybeGetter<VirtualSvelteGridItemBinding>
    ): Attachment<HTMLElement> =>
    element => {
        let current = untrack(() => readGetter(binding));
        let attached = 0;
        const attach = () => {
            if (current.rows.from === current.rowIndex) {
                current.columns.attachItem(element, current.columnIndex);
                attached |= 1;
            }
            if (current.columns.from === current.columnIndex) {
                current.rows.attachItem(element, current.rowIndex);
                attached |= 2;
            }
        };
        const detach = () => {
            if (attached & 1) current.columns.detachItem(element);
            if (attached & 2) current.rows.detachItem(element);
            attached = 0;
        };

        attach();
        if (typeof binding === "function") {
            $effect(() => {
                const next = binding();
                if (
                    next.rows === current.rows &&
                    next.rowIndex === current.rowIndex &&
                    next.columns === current.columns &&
                    next.columnIndex === current.columnIndex
                ) {
                    return;
                }
                detach();
                current = next;
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
