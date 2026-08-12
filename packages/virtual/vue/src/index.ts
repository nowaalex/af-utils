/** @packageDocumentation Vue primitives used to connect to `VirtualScroller`. */

import {
    mapVirtualRange,
    VirtualScroller,
    VirtualScrollerEvent,
    type VirtualScrollerEventMask,
    type VirtualScrollerInitialParams,
    VirtualScrollerLayout,
    type VirtualScrollerLayoutStyle
} from "@af-utils/virtual-core";
import {
    markRaw,
    defineComponent,
    h,
    onMounted,
    onScopeDispose,
    reactive,
    shallowRef,
    toValue,
    watch,
    type MaybeRefOrGetter,
    type Directive,
    type ComponentPublicInstance,
    type ShallowRef
} from "vue";

/** DOM template-ref callback accepted by Vue. @public */
export type VirtualVueElementRef = (
    element: Element | ComponentPublicInstance | null
) => void;

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
    let frame = 0;
    const unsubscribe = model.subscribe(() => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
            frame = 0;
            revision.value = model.getRevision(events);
        });
    }, events);
    onScopeDispose(() => {
        unsubscribe();
        cancelAnimationFrame(frame);
    });
    return revision;
};

/** Vue refs and hydration-safe styles for virtual layout elements. @public */
export interface VirtualVueLayoutBinding {
    scrollerRef: VirtualVueElementRef;
    sizeRef: VirtualVueElementRef;
    itemsRef: VirtualVueElementRef;
    scrollerStyle: VirtualScrollerLayoutStyle;
    sizeStyle: VirtualScrollerLayoutStyle;
    itemsStyle: VirtualScrollerLayoutStyle;
}

/** Connect Vue template refs to the framework-neutral layout adapter. @public */
export const useVirtualLayout = (
    model: VirtualScroller,
    scrollerStyle: VirtualScrollerLayoutStyle = {}
): VirtualVueLayoutBinding => {
    const layout = markRaw(new VirtualScrollerLayout(model));
    const interactiveStyle = {
        overflow: "auto",
        contain: "strict",
        ...scrollerStyle
    };
    const renderedScrollerStyle = reactive({
        ...layout.getScrollerElementStyle(interactiveStyle)
    });
    let mounted = false;
    let scrollerElement: HTMLElement | null = null;
    let sizeElement: HTMLElement | null = null;
    let itemsElement: HTMLElement | null = null;

    onMounted(() => {
        mounted = true;
        Object.assign(renderedScrollerStyle, interactiveStyle);
        layout.setScrollerElement(scrollerElement, interactiveStyle);
        layout.setSizeElement(sizeElement);
        layout.setItemsElement(itemsElement);
    });
    onScopeDispose(() => {
        mounted = false;
        layout.dispose();
    });

    return {
        scrollerRef: element => {
            scrollerElement = element as HTMLElement | null;
            if (mounted) {
                layout.setScrollerElement(scrollerElement, interactiveStyle);
            }
        },
        sizeRef: element => {
            sizeElement = element as HTMLElement | null;
            if (mounted) layout.setSizeElement(sizeElement);
        },
        itemsRef: element => {
            itemsElement = element as HTMLElement | null;
            if (mounted) layout.setItemsElement(itemsElement);
        },
        scrollerStyle: renderedScrollerStyle,
        sizeStyle: layout.getSizeElementStyle(),
        itemsStyle: layout.getItemsElementStyle()
    };
};

/** Create a Vue template-ref callback that observes one virtual item. @public */
export const useVirtualItemRef = (
    model: VirtualScroller,
    index: MaybeRefOrGetter<number>
): VirtualVueElementRef => {
    let attached: HTMLElement | null = null;
    const detach = () => {
        if (attached) model.detachItem(attached);
        attached = null;
    };
    onScopeDispose(detach);
    return element => {
        detach();
        if (element) {
            attached = element as HTMLElement;
            model.attachItem(attached, toValue(index));
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

/** Reactive rendered indexes for a Vue render function or template. @public */
export const useVirtualRange = (model: VirtualScroller) => {
    const revision = useVirtualSnapshot(model, VirtualScrollerEvent.RANGE);
    return () => {
        void revision.value;
        return mapVirtualRange(model, index => index);
    };
};

/** Keep optional content slots outside the range-driven render effect. */
const VirtualSlot = defineComponent({
    name: "VirtualSlot",
    setup(_props, { slots }) {
        return () => slots.default?.();
    }
});

/** Re-render only virtual items when the model publishes a new range. */
const VirtualItems = defineComponent({
    name: "VirtualItems",
    props: {
        model: { type: VirtualScroller, required: true },
        itemData: { type: null, required: false }
    },
    setup(props, { slots }) {
        const range = useVirtualRange(props.model);
        return () =>
            range().map(index =>
                slots.default?.({
                    model: props.model,
                    index,
                    data: props.itemData
                })
            );
    }
});

/** Minimal Vue virtual-list component for the common block-list case. @public */
export const VirtualList = defineComponent({
    name: "VirtualList",
    inheritAttrs: false,
    props: {
        /** Model owning list geometry. */
        model: { type: VirtualScroller, required: true },
        /** Optional data forwarded to the item slot. */
        itemData: { type: null, required: false }
    },
    setup(props, { attrs, slots }) {
        const layout = useVirtualLayout(props.model);
        return () =>
            h(
                "div",
                {
                    ...attrs,
                    ref: layout.scrollerRef,
                    style: layout.scrollerStyle
                } as Record<string, unknown>,
                [
                    slots.header
                        ? h(VirtualSlot, null, { default: slots.header })
                        : null,
                    h(
                        "div",
                        {
                            ref: layout.sizeRef,
                            style: layout.sizeStyle
                        } as Record<string, unknown>,
                        [
                            h(
                                "div",
                                {
                                    ref: layout.itemsRef,
                                    style: layout.itemsStyle
                                } as Record<string, unknown>,
                                h(
                                    VirtualItems,
                                    {
                                        model: props.model,
                                        itemData: props.itemData
                                    },
                                    slots.default
                                        ? { default: slots.default }
                                        : undefined
                                )
                            )
                        ]
                    ),
                    slots.footer
                        ? h(VirtualSlot, null, { default: slots.footer })
                        : null
                ]
            );
    }
});
