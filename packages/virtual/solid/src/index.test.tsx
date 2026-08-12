import { VirtualScroller, VirtualScrollerEvent } from "@af-utils/virtual-core";
import { createRoot, createSignal, type JSX } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import List from "./components/List";
import createVirtual from "./primitives/createVirtual";
import { createVirtualItemRef } from "./primitives/createVirtualItemRef";
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
        Item {props.index}
    </div>
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
        let disposeRoot = () => {};
        let setItemCount = (_value: number) => {};
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
        expect(setSpy).toHaveBeenCalledTimes(1);
        setItemCount(20);
        expect(model?.itemCount).toBe(20);
        expect(setSpy).toHaveBeenCalledTimes(2);
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
            return <List model={model}>{Item}</List>;
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
});
