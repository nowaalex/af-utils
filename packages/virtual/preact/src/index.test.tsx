import { VirtualScrollerEvent } from "@af-utils/virtual-core";
import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, test, vi } from "vitest";
import useVirtual from "./hooks/useVirtual";
import useVirtualSnapshot from "./hooks/useVirtualSnapshot";
import VirtualList from "./components/List";
import type { ListItemProps } from "./types";

let container: HTMLDivElement;

interface KeyedRecord {
    id: string;
}

const KeyedItem = ({ index, data }: ListItemProps<KeyedRecord[]>) => (
    <div data-id={data?.[index].id}>{data?.[index].id}</div>
);

class NoopResizeObserver implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

globalThis.ResizeObserver = NoopResizeObserver;

afterEach(() => {
    if (container) render(null, container);
});

describe("Preact adapter", () => {
    test("synchronizes parameters and disposes its model", () => {
        container = document.createElement("div");
        let itemCount = 3;
        let model: ReturnType<typeof useVirtual> | undefined;

        const App = () => {
            model = useVirtual({ itemCount });
            return null;
        };

        void act(() => render(<App />, container));
        expect(model?.itemCount).toBe(3);
        const dispose = vi.spyOn(model!, "dispose");

        itemCount = 7;
        void act(() => render(<App />, container));
        expect(model?.itemCount).toBe(7);

        void act(() => render(null, container));
        expect(dispose).toHaveBeenCalledOnce();
    });

    test("subscribes to the selected revision", () => {
        container = document.createElement("div");
        let itemCount = 3;
        let model: ReturnType<typeof useVirtual> | undefined;

        const App = () => {
            model = useVirtual({ itemCount });
            return (
                <output>
                    {useVirtualSnapshot(
                        model,
                        VirtualScrollerEvent.SCROLL_SIZE
                    )}
                </output>
            );
        };

        void act(() => render(<App />, container));
        const initial = container.textContent;
        itemCount = 4;
        void act(() => render(<App />, container));
        expect(Number(container.textContent)).toBe(Number(initial) + 1);
    });

    test("preserves keyed item DOM when data order changes", () => {
        container = document.createElement("div");
        let items = [{ id: "a" }, { id: "b" }, { id: "c" }];

        let virtualModel: ReturnType<typeof useVirtual> | undefined;
        const App = () => {
            virtualModel = useVirtual({
                itemCount: items.length
            });
            return (
                <VirtualList
                    model={virtualModel}
                    itemData={items}
                    getItemKey={index => items[index].id}
                >
                    {KeyedItem}
                </VirtualList>
            );
        };

        void act(() => render(<App />, container));
        const retained = container.querySelector('[data-id="a"]');
        items = [items[2], items[1], items[0]];
        void act(() => render(<App />, container));

        expect(container.querySelector('[data-id="a"]')).toBe(retained);
    });
});
