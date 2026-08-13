import { VirtualScroller } from "@af-utils/virtual-core";
import {
    createApp,
    defineComponent,
    h,
    nextTick,
    ref,
    withDirectives
} from "vue";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
    useVirtual,
    useVirtualLayout,
    useVirtualSnapshot,
    virtualItemDirective,
    VirtualList
} from ".";

class NoopResizeObserver implements ResizeObserver {
    /** Ignore one observation in deterministic DOM tests. */
    observe() {}
    /** Ignore one unobserve operation in deterministic DOM tests. */
    unobserve() {}
    /** Ignore observer disconnection in deterministic DOM tests. */
    disconnect() {}
}

globalThis.ResizeObserver = NoopResizeObserver;

describe("Vue virtual adapter", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.append(container);
    });

    afterEach(() => {
        container.remove();
        vi.restoreAllMocks();
    });

    test("synchronizes reactive parameters and disposes the model", async () => {
        const disposeSpy = vi.spyOn(VirtualScroller.prototype, "dispose");
        const count = ref(10);
        let model: VirtualScroller | undefined;
        const app = createApp(
            defineComponent({
                setup() {
                    model = useVirtual(() => ({ itemCount: count.value }));
                    return () => null;
                }
            })
        );
        app.mount(container);
        expect(model?.itemCount).toBe(10);
        count.value = 20;
        await nextTick();
        expect(model?.itemCount).toBe(20);
        app.unmount();
        expect(disposeSpy).toHaveBeenCalledOnce();
    });

    test("bridges revisions synchronously and item directive lifecycle", async () => {
        const model = new VirtualScroller({ itemCount: 1 });
        const attachSpy = vi.spyOn(model, "attachItem");
        const detachSpy = vi.spyOn(model, "detachItem");
        let snapshotRef: ReturnType<typeof useVirtualSnapshot> | undefined;
        let revision = 0;
        const app = createApp(
            defineComponent({
                setup() {
                    const snapshot = useVirtualSnapshot(model);
                    snapshotRef = snapshot;
                    return () => {
                        revision = snapshot.value;
                        return withDirectives(h("div"), [
                            [virtualItemDirective, [model, 0] as const]
                        ]);
                    };
                }
            })
        );
        app.mount(container);
        expect(attachSpy).toHaveBeenCalledOnce();
        const revisionBefore = snapshotRef?.value ?? 0;
        model.setItemCount(2);
        expect(snapshotRef?.value).toBeGreaterThan(revisionBefore);
        await nextTick();
        expect(revision).toBeGreaterThan(0);
        app.unmount();
        expect(detachSpy).toHaveBeenCalledOnce();
        model.dispose();
    });

    test("lets core apply the complete layout through Vue refs", async () => {
        const model = new VirtualScroller({ itemCount: 10 });
        const app = createApp(
            defineComponent({
                setup() {
                    const layout = useVirtualLayout(model);
                    return () =>
                        h(
                            "div",
                            {
                                ref: layout.scrollerRef
                            },
                            [
                                h(
                                    "div",
                                    {
                                        ref: layout.sizeRef
                                    },
                                    [
                                        h("div", {
                                            ref: layout.itemsRef
                                        })
                                    ]
                                )
                            ]
                        );
                }
            })
        );

        app.mount(container);
        await nextTick();

        const scroller = container.firstElementChild as HTMLElement;
        const sizeElement = scroller.firstElementChild as HTMLElement;
        const itemsElement = sizeElement.firstElementChild as HTMLElement;
        expect(scroller.style.overflow).toBe("auto");
        expect(scroller.style.contain).toBe("strict");
        expect(sizeElement.style.height).toBe("400px");
        expect(itemsElement.style.transform).toBe("translate3d(0px, 0px, 0px)");

        app.unmount();
        model.dispose();
    });

    test("isolates header and footer slots from range updates", async () => {
        const model = new VirtualScroller({ itemCount: 10 });
        let headerRenders = 0;
        let footerRenders = 0;
        const app = createApp(
            defineComponent({
                setup() {
                    return () =>
                        h(
                            VirtualList,
                            { model },
                            {
                                header: () => {
                                    headerRenders++;
                                    return h("header", "header");
                                },
                                default: ({ index }: { index: number }) =>
                                    h("div", String(index)),
                                footer: () => {
                                    footerRenders++;
                                    return h("footer", "footer");
                                }
                            }
                        );
                }
            })
        );

        app.mount(container);
        await nextTick();
        const initialHeaderRenders = headerRenders;
        const initialFooterRenders = footerRenders;

        model.setItemCount(1);
        await nextTick();

        expect(headerRenders).toBe(initialHeaderRenders);
        expect(footerRenders).toBe(initialFooterRenders);
        expect(container.querySelectorAll("header")).toHaveLength(1);
        expect(container.querySelectorAll("footer")).toHaveLength(1);

        app.unmount();
        model.dispose();
    });
});
