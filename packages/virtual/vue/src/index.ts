/** @packageDocumentation Vue primitives used to connect to `VirtualScroller`. */

import {
    mapVirtualRange,
    VirtualScroller,
    VirtualScrollerEvent,
    type VirtualScrollerEventMask,
    type VirtualScrollerInitialParams,
    VirtualScrollerLayout
} from "@af-utils/virtual-core";
import {
    computed,
    defineComponent,
    Fragment,
    h,
    markRaw,
    onMounted,
    onScopeDispose,
    shallowRef,
    toValue,
    watch,
    type AllowedComponentProps,
    type ComponentCustomProps,
    type ComponentOptionsMixin,
    type ComponentPublicInstance,
    type DefineComponent,
    type Directive,
    type MaybeRefOrGetter,
    type PropType,
    type ShallowRef,
    type SlotsType,
    type VNode,
    type VNodeProps
} from "vue";

/** DOM template-ref callback accepted by Vue. @public */
export type VirtualVueElementRef = (
    element: Element | ComponentPublicInstance | null
) => void;

/** Resolve a native HTMLElement from a Vue template-ref value. */
const resolveHTMLElement = (
    element: Element | ComponentPublicInstance | null
) => {
    if (element instanceof HTMLElement) return element;
    if (element && "$el" in element && element.$el instanceof HTMLElement) {
        return element.$el;
    }
    return null;
};

/** Vue-owned virtual-scroller model synchronized with reactive parameters. @public */
export const useVirtual = (
    params: MaybeRefOrGetter<VirtualScrollerInitialParams>
) => {
    const model = markRaw(new VirtualScroller(toValue(params)));
    watch(
        () => toValue(params),
        value => model.set(value),
        { deep: true }
    );
    onScopeDispose(() => model.dispose());
    return model;
};

/** Reactive revision for selected model events. @public */
export const useVirtualSnapshot = (
    model: VirtualScroller,
    events: VirtualScrollerEventMask = VirtualScrollerEvent.RANGE
): ShallowRef<number> => {
    const revision = shallowRef(model.getRevision(events));
    const unsubscribe = model.subscribe(() => {
        revision.value = model.getRevision(events);
    }, events);
    onScopeDispose(unsubscribe);
    return revision;
};

/**
 * Vue refs for the three elements explained in the
 * [layout-elements guide](/virtual/guides/layout-elements).
 *
 * @public
 */
export interface VirtualVueLayoutBinding {
    /** Attach the [scroller element](/virtual/guides/layout-elements#scroller-ref). */
    scrollerRef: VirtualVueElementRef;
    /** Attach the [native size element](/virtual/guides/layout-elements#size-ref). */
    sizeRef: VirtualVueElementRef;
    /** Attach the [rendered-items element](/virtual/guides/layout-elements#items-ref). */
    itemsRef: VirtualVueElementRef;
}

/**
 * Connect Vue template refs for the three
 * [layout elements](/virtual/guides/layout-elements).
 *
 * @public
 */
export const useVirtualLayout = (
    model: VirtualScroller
): VirtualVueLayoutBinding => {
    const layout = markRaw(new VirtualScrollerLayout(model));
    let mounted = false;
    let scrollerElement: HTMLElement | null = null;
    let sizeElement: HTMLElement | null = null;
    let itemsElement: HTMLElement | null = null;

    onMounted(() => {
        mounted = true;
        layout.setScrollerElement(scrollerElement);
        layout.setSizeElement(sizeElement);
        layout.setItemsElement(itemsElement);
    });
    onScopeDispose(() => {
        mounted = false;
        layout.dispose();
    });

    return {
        scrollerRef: element => {
            const nextElement = resolveHTMLElement(element);
            if (nextElement === scrollerElement) return;
            scrollerElement = nextElement;
            if (mounted) {
                layout.setScrollerElement(scrollerElement);
            }
        },
        sizeRef: element => {
            const nextElement = resolveHTMLElement(element);
            if (nextElement === sizeElement) return;
            sizeElement = nextElement;
            if (mounted) layout.setSizeElement(sizeElement);
        },
        itemsRef: element => {
            const nextElement = resolveHTMLElement(element);
            if (nextElement === itemsElement) return;
            itemsElement = nextElement;
            if (mounted) layout.setItemsElement(itemsElement);
        }
    };
};

/** Directive value accepted by {@link virtualItemDirective}. @public */
export type VirtualVueItemBinding = readonly [VirtualScroller, number];

/** Vue directive that observes the size of one rendered virtual item. @public */
export const virtualItemDirective: Directive<
    HTMLElement,
    VirtualVueItemBinding
> = {
    mounted(element, { value: [model, index] }) {
        model.attachItem(element, index);
    },
    updated(element, { value: [model, index], oldValue }) {
        if (oldValue?.[0] === model && oldValue[1] === index) return;
        oldValue?.[0].detachItem(element);
        model.attachItem(element, index);
    },
    unmounted(element, { value: [model] }) {
        model.detachItem(element);
    }
};

/** Directive value accepted by {@link virtualGridItemDirective}. @public */
export type VirtualVueGridItemBinding = readonly [
    rows: VirtualScroller,
    row: number,
    columns: VirtualScroller,
    column: number
];

interface VirtualVueGridItemState {
    binding: VirtualVueGridItemBinding;
    attached: number;
}

const gridItemStates = new WeakMap<HTMLElement, VirtualVueGridItemState>();

/** Attach only the first visible row and column needed for grid measurement. */
const attachGridItem = (
    element: HTMLElement,
    binding: VirtualVueGridItemBinding
) => {
    const [rows, row, columns, column] = binding;
    let attached = 0;

    if (rows.from === row) {
        columns.attachItem(element, column);
        attached |= 1;
    }
    if (columns.from === column) {
        rows.attachItem(element, row);
        attached |= 2;
    }
    gridItemStates.set(element, { attached, binding });
};

/** Detach the dimensions previously selected by {@link attachGridItem}. */
const detachGridItem = (element: HTMLElement) => {
    const state = gridItemStates.get(element);
    if (!state) return;
    const [rows, , columns] = state.binding;
    if (state.attached & 1) columns.detachItem(element);
    if (state.attached & 2) rows.detachItem(element);
    gridItemStates.delete(element);
};

/** Vue directive that observes O(rows + columns) representative grid cells. @public */
export const virtualGridItemDirective: Directive<
    HTMLElement,
    VirtualVueGridItemBinding
> = {
    mounted(element, { value }) {
        attachGridItem(element, value);
    },
    updated(element, { value, oldValue }) {
        if (
            oldValue?.[0] === value[0] &&
            oldValue[1] === value[1] &&
            oldValue[2] === value[2] &&
            oldValue[3] === value[3]
        ) {
            return;
        }
        detachGridItem(element);
        attachGridItem(element, value);
    },
    unmounted: detachGridItem
};

/** Reactive rendered indexes for a Vue render function or template. @public */
export const useVirtualRange = (model: VirtualScroller) => {
    const revision = useVirtualSnapshot(model, VirtualScrollerEvent.RANGE);
    return computed(() => {
        void revision.value;
        return mapVirtualRange(model, index => index);
    });
};

/** Re-render only virtual items when the model publishes a new range. */
const VirtualItems = defineComponent({
    name: "VirtualItems",
    props: {
        model: { type: VirtualScroller, required: true },
        getItemKey: {
            type: Function as PropType<(index: number) => string | number>,
            required: false
        }
    },
    slots: Object as SlotsType<{
        default(props: { model: VirtualScroller; index: number }): VNode[];
    }>,
    setup(props, { slots }) {
        const range = useVirtualRange(props.model);
        return () =>
            range.value.map(index =>
                h(
                    Fragment,
                    { key: props.getItemKey?.(index) ?? index },
                    slots.default?.({
                        model: props.model,
                        index
                    }) ?? []
                )
            );
    }
});

/** Slots exposed by {@link VirtualList}. @public */
export type VirtualListSlots = SlotsType<{
    header(): VNode[];
    default(props: { model: VirtualScroller; index: number }): VNode[];
    footer(): VNode[];
}>;

/** Stable public component type that does not depend on Vue patch internals. @public */
export type VirtualListComponent = DefineComponent<
    {
        model: VirtualScroller;
        getItemKey?: (index: number) => string | number;
    },
    {},
    {},
    {},
    {},
    ComponentOptionsMixin,
    ComponentOptionsMixin,
    {},
    string,
    VNodeProps & AllowedComponentProps & ComponentCustomProps,
    Readonly<{
        model: VirtualScroller;
        getItemKey?: (index: number) => string | number;
    }>,
    {},
    VirtualListSlots
>;

/** Minimal Vue virtual-list component for the common block-list case. @public */
export const VirtualList = defineComponent({
    name: "VirtualList",
    inheritAttrs: false,
    props: {
        /** Model owning list geometry. */
        model: { type: VirtualScroller, required: true },
        /** Resolve stable item identities after records change index. */
        getItemKey: {
            type: Function as PropType<(index: number) => string | number>,
            required: false
        }
    },
    slots: Object as VirtualListSlots,
    setup(props, { attrs, slots }) {
        const layout = useVirtualLayout(props.model);
        return () =>
            h(
                "div",
                {
                    ...attrs,
                    ref: layout.scrollerRef
                } as Record<string, unknown>,
                [
                    slots.header?.(),
                    h(
                        "div",
                        {
                            ref: layout.sizeRef
                        } as Record<string, unknown>,
                        [
                            h(
                                "div",
                                {
                                    ref: layout.itemsRef
                                } as Record<string, unknown>,
                                h(
                                    VirtualItems,
                                    {
                                        model: props.model,
                                        getItemKey: props.getItemKey
                                    },
                                    slots.default
                                        ? { default: slots.default }
                                        : undefined
                                )
                            )
                        ]
                    ),
                    slots.footer?.()
                ]
            );
    }
}) as VirtualListComponent;
