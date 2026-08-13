/**
 * @packageDocumentation
 * Svelte stores and actions used to connect to `VirtualScroller`.
 */

import {
    mapVirtualRange,
    VirtualScroller,
    VirtualScrollerEvent,
    type VirtualScrollerEventMask,
    type VirtualScrollerInitialParams,
    VirtualScrollerLayout
} from "@af-utils/virtual-core";
import { onDestroy } from "svelte";
import type { Action } from "svelte/action";
import { get, readable, type Readable } from "svelte/store";

/** A static value or a Svelte readable store containing that value. @public */
export type MaybeReadable<Value> = Value | Readable<Value>;

/** Parameters accepted by the {@link virtualItem} action. @public */
export interface VirtualSvelteItemBinding {
    /** Model that observes the item. */
    model: VirtualScroller;
    /** Current item index. */
    index: number;
}

/** Parameters accepted by the {@link virtualGridItem} action. @public */
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
 * Svelte actions for the three elements explained in the
 * [layout-elements guide](/virtual/guides/layout-elements).
 *
 * @public
 */
export interface VirtualSvelteLayoutBinding {
    /** Action attaching the [scroller element](/virtual/guides/layout-elements#scroller-ref). */
    scroller: Action<HTMLElement>;
    /** Action attaching the [native size element](/virtual/guides/layout-elements#size-ref). */
    size: Action<HTMLElement>;
    /** Action attaching the [rendered-items element](/virtual/guides/layout-elements#items-ref). */
    items: Action<HTMLElement>;
}

/** Range store and layout actions for the common virtual-list shape. @public */
export interface VirtualSvelteListBinding extends VirtualSvelteLayoutBinding {
    /** Readable array containing the currently rendered indexes. */
    range: Readable<number[]>;
}

/** Return whether a value implements the Svelte readable-store contract. */
const isReadable = <Value>(
    value: MaybeReadable<Value>
): value is Readable<Value> =>
    typeof (value as Partial<Readable<Value>>).subscribe === "function";

/**
 * Create a component-owned model and synchronize it with an optional store.
 *
 * @remarks Call this helper during Svelte component initialization.
 * @public
 */
export const createVirtual = (
    params: MaybeReadable<VirtualScrollerInitialParams>
) => {
    const model = new VirtualScroller(
        isReadable(params) ? get(params) : params
    );
    let initialized = false;
    const unsubscribe = isReadable(params)
        ? params.subscribe(value => {
              if (initialized) model.set(value);
              else initialized = true;
          })
        : undefined;

    onDestroy(() => {
        unsubscribe?.();
        model.dispose();
    });
    return model;
};

/**
 * Create a readable numeric revision for selected model events.
 *
 * @public
 */
export const createVirtualSnapshot = (
    model: VirtualScroller,
    events: VirtualScrollerEventMask = VirtualScrollerEvent.RANGE
): Readable<number> =>
    readable(model.getRevision(events), set =>
        model.subscribe(() => set(model.getRevision(events)), events)
    );

/** Create a readable array containing the currently rendered indexes. @public */
export const createVirtualRange = (
    model: VirtualScroller
): Readable<number[]> =>
    readable(
        mapVirtualRange(model, index => index),
        set =>
            model.subscribe(
                () => set(mapVirtualRange(model, index => index)),
                VirtualScrollerEvent.RANGE
            )
    );

/**
 * Connect Svelte actions to the framework-neutral virtual layout adapter.
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
    onDestroy(() => layout.dispose());

    return {
        scroller: element => {
            layout.setScrollerElement(element);
            return { destroy: () => layout.setScrollerElement(null) };
        },
        size: element => {
            layout.setSizeElement(element);
            return { destroy: () => layout.setSizeElement(null) };
        },
        items: element => {
            layout.setItemsElement(element);
            return { destroy: () => layout.setItemsElement(null) };
        }
    };
};

/**
 * Create the range store and actions for the three
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

/** Attach an arbitrary element as the model's scroller. @public */
export const virtualScroller: Action<HTMLElement, VirtualScroller> = (
    element,
    model
) => {
    model.setScroller(element);
    return {
        update(nextModel) {
            model.setScroller(null);
            model = nextModel;
            model.setScroller(element);
        },
        destroy() {
            model.setScroller(null);
        }
    };
};

/** Attach an arbitrary element as the model's rendered-item container. @public */
export const virtualContainer: Action<HTMLElement, VirtualScroller> = (
    element,
    model
) => {
    model.setContainer(element);
    return {
        update(nextModel) {
            model.setContainer(null);
            model = nextModel;
            model.setContainer(element);
        },
        destroy() {
            model.setContainer(null);
        }
    };
};

/** Observe one rendered virtual item through a Svelte action. @public */
export const virtualItem: Action<HTMLElement, VirtualSvelteItemBinding> = (
    element,
    initialBinding
) => {
    let binding = initialBinding;
    binding.model.attachItem(element, binding.index);

    return {
        update(nextBinding) {
            if (
                nextBinding.model === binding.model &&
                nextBinding.index === binding.index
            ) {
                return;
            }
            binding.model.detachItem(element);
            binding = nextBinding;
            binding.model.attachItem(element, binding.index);
        },
        destroy() {
            binding.model.detachItem(element);
        }
    };
};

/** Observe row and column sizes for one rendered grid cell. @public */
export const virtualGridItem: Action<
    HTMLElement,
    VirtualSvelteGridItemBinding
> = (element, initialBinding) => {
    let binding = initialBinding;
    let attached = 0;

    /** Attach the element using the current row and column binding. */
    const attach = () => {
        attached = 0;
        if (binding.rows.from === binding.rowIndex) {
            binding.columns.attachItem(element, binding.columnIndex);
            attached |= 1;
        }
        if (binding.columns.from === binding.columnIndex) {
            binding.rows.attachItem(element, binding.rowIndex);
            attached |= 2;
        }
    };
    /** Detach every model that currently observes the grid cell. */
    const detach = () => {
        if (attached & 1) binding.columns.detachItem(element);
        if (attached & 2) binding.rows.detachItem(element);
        attached = 0;
    };

    attach();
    return {
        update(nextBinding) {
            if (
                nextBinding.rows === binding.rows &&
                nextBinding.rowIndex === binding.rowIndex &&
                nextBinding.columns === binding.columns &&
                nextBinding.columnIndex === binding.columnIndex
            ) {
                return;
            }
            detach();
            binding = nextBinding;
            attach();
        },
        destroy: detach
    };
};

/** Attach an element as the model's sticky header. @public */
export const virtualStickyHeader: Action<HTMLElement, VirtualScroller> = (
    element,
    model
) => {
    model.setStickyHeader(element);
    return {
        update(nextModel) {
            model.setStickyHeader(null);
            model = nextModel;
            model.setStickyHeader(element);
        },
        destroy() {
            model.setStickyHeader(null);
        }
    };
};

/** Attach an element as the model's sticky footer. @public */
export const virtualStickyFooter: Action<HTMLElement, VirtualScroller> = (
    element,
    model
) => {
    model.setStickyFooter(element);
    return {
        update(nextModel) {
            model.setStickyFooter(null);
            model = nextModel;
            model.setStickyFooter(element);
        },
        destroy() {
            model.setStickyFooter(null);
        }
    };
};
