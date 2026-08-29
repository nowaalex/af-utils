import { VirtualScroller, VirtualScrollerEvent } from "@af-utils/virtual-core";
import { createRoot, createSignal, type JSX } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import VirtualList from "./components/List";
import createVirtual from "./primitives/createVirtual";
import { createVirtualItemRef } from "./primitives/createVirtualItemRef";
import createVirtualLayout from "./primitives/createVirtualLayout";
import createVirtualSnapshot from "./primitives/createVirtualSnapshot";
import type { ListItemProps } from "./types";

class NoopResizeObserver implements ResizeObserver {
    /** Ignore one observation in deterministic DOM tests. */
    observe() {}

    /** Ignore one unobserve operation in deterministic DOM tests. */
    unobserve() {}

    /** Ignore observer disconnection in deterministic DOM tests. */
    disconnect() {}
}

globalThis.ResizeObserver = NoopResizeObserver;

const Item = (props: ListItemProps): JSX.Element => (
    <div ref={createVirtualItemRef(props.model, props.index)}>
        Item {props.index()}
    </div>
);

const noopDispose = () => {};
const noopSetItemCount = (_value: number) => {};
interface KeyedRecord {
    id: string;
}

const KeyedItem = (props: ListItemProps<KeyedRecord[]>) => (
    <div
        ref={createVirtualItemRef(props.model, props.index)}
        data-id={props.data?.[props.index()]?.id}
        data-index={props.index()}
    />
);

describe("Solid virtual adapter", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.append(container);
    });

    afterEach(() => {
        container.remove();
        vi.restoreAllMocks();
    });

    test("updates model parameters from a Solid accessor", () => {
        const setSpy = vi.spyOn(VirtualScroller.prototype, "set");
        let disposeRoot = noopDispose;
        let setItemCount = noopSetItemCount;
        let model: VirtualScroller | undefined;

        createRoot(dispose => {
            const [itemCount, updateItemCount] = createSignal(10);
            model = createVirtual(() => ({
                itemCount: itemCount(),
                estimatedItemSize: 40
            }));
            setItemCount = updateItemCount;
            disposeRoot = dispose;
        });

        expect(model?.itemCount).toBe(10);
        expect(setSpy).toHaveBeenCalledTimes(2);
        setItemCount(20);
        expect(model?.itemCount).toBe(20);
        expect(setSpy).toHaveBeenCalledTimes(3);
        disposeRoot();
    });

    test("publishes selected model revisions through a Solid accessor", () => {
        createRoot(dispose => {
            const model = new VirtualScroller({ itemCount: 10 });
            const revision = createVirtualSnapshot(
                model,
                VirtualScrollerEvent.SCROLL_SIZE
            );
            const before = revision();

            model.setItemCount(20);

            expect(revision()).toBeGreaterThan(before);
            dispose();
        });
    });

    test("renders and updates layout without recreating the Solid list", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 10
        });
        const setContainerSpy = vi.spyOn(model, "setContainer");
        let renders = 0;

        const Harness = () => {
            renders++;
            return <VirtualList model={model}>{Item}</VirtualList>;
        };
        const dispose = render(() => <Harness />, container);
        const scroller = container.firstElementChild as HTMLElement;
        const sizeElement = scroller.firstElementChild as HTMLElement;

        expect(scroller.style.overflow).toBe("auto");
        expect(sizeElement.style.height).toBe("400px");
        expect(setContainerSpy).toHaveBeenCalledWith(sizeElement);

        model.setItemCount(20);

        expect(sizeElement.style.height).toBe("800px");
        expect(renders).toBe(1);
        dispose();
    });

    test("connects initial layout elements after DOM insertion", () => {
        const model = new VirtualScroller({ itemCount: 10 });
        const scrollerConnectionStates: boolean[] = [];
        const containerConnectionStates: boolean[] = [];
        vi.spyOn(model, "setScroller").mockImplementation(element => {
            if (element instanceof HTMLElement) {
                scrollerConnectionStates.push(element.isConnected);
            }
        });
        vi.spyOn(model, "setContainer").mockImplementation(element => {
            if (element) containerConnectionStates.push(element.isConnected);
        });

        const dispose = render(
            () => <VirtualList model={model}>{Item}</VirtualList>,
            container
        );

        expect(scrollerConnectionStates).toEqual([true]);
        expect(containerConnectionStates).toEqual([true]);

        dispose();
        model.dispose();
    });

    test("rebinds layout refs when Solid replaces their elements", () => {
        const [alternate, setAlternate] = createSignal(false);
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            itemCount: 10
        });
        const setScrollerSpy = vi.spyOn(model, "setScroller");
        const setContainerSpy = vi.spyOn(model, "setContainer");

        const Harness = () => {
            const layout = createVirtualLayout(model);
            return (
                <>
                    {alternate() ? (
                        <section
                            data-layout="alternate"
                            ref={layout.scrollerRef}
                        >
                            <div ref={layout.sizeRef}>
                                <div ref={layout.itemsRef} />
                            </div>
                        </section>
                    ) : (
                        <div data-layout="initial" ref={layout.scrollerRef}>
                            <div ref={layout.sizeRef}>
                                <div ref={layout.itemsRef} />
                            </div>
                        </div>
                    )}
                </>
            );
        };
        const dispose = render(() => <Harness />, container);
        const initialScroller = container.querySelector(
            '[data-layout="initial"]'
        ) as HTMLElement;
        const initialSize = initialScroller.firstElementChild as HTMLElement;

        expect(setScrollerSpy).toHaveBeenLastCalledWith(initialScroller);
        expect(setContainerSpy).toHaveBeenLastCalledWith(initialSize);

        setAlternate(true);

        const alternateScroller = container.querySelector(
            '[data-layout="alternate"]'
        ) as HTMLElement;
        const alternateSize =
            alternateScroller.firstElementChild as HTMLElement;
        expect(alternateScroller).not.toBe(initialScroller);
        expect(setScrollerSpy).toHaveBeenLastCalledWith(alternateScroller);
        expect(setContainerSpy).toHaveBeenLastCalledWith(alternateSize);

        model.setItemCount(20);
        expect(alternateSize.style.height).toBe("800px");

        dispose();
        model.dispose();
    });

    test("detaches item observation with its Solid owner", () => {
        const model = new VirtualScroller({ itemCount: 1 });
        const attachSpy = vi.spyOn(model, "attachItem");
        const detachSpy = vi.spyOn(model, "detachItem");
        const dispose = render(
            () => <div ref={createVirtualItemRef(model, 0)} />,
            container
        );
        const item = container.firstElementChild as HTMLElement;

        expect(attachSpy).toHaveBeenCalledWith(item, 0);
        dispose();
        expect(detachSpy).toHaveBeenCalledWith(item);
    });

    test("preserves keyed item DOM and updates its reactive index", () => {
        const [items, setItems] = createSignal([
            { id: "a" },
            { id: "b" },
            { id: "c" }
        ]);
        const model = new VirtualScroller({
            itemCount: items().length
        });
        const dispose = render(
            () => (
                <VirtualList
                    model={model}
                    itemData={items()}
                    getItemKey={index => items()[index].id}
                >
                    {KeyedItem}
                </VirtualList>
            ),
            container
        );
        const retained = container.querySelector('[data-id="a"]');

        setItems(current => [current[2], current[1], current[0]]);

        expect(container.querySelector('[data-id="a"]')).toBe(retained);
        expect(retained?.getAttribute("data-index")).toBe("2");
        dispose();
        model.dispose();
    });
});
