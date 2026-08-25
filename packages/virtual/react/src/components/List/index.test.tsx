// @vitest-environment jsdom

import { VirtualScroller } from "@af-utils/virtual-core";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type { ListItemProps } from "../../types";
import VirtualList from ".";

class NoopResizeObserver implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

globalThis.ResizeObserver = NoopResizeObserver;
(
    globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const Item = ({ index }: ListItemProps) => <div>Item {index}</div>;
const KeyedItem = ({ index, data }: ListItemProps<{ id: string }[]>) => (
    <div data-id={data?.[index].id}>{data?.[index].id}</div>
);

describe("VirtualList layout", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.append(container);
    });

    afterEach(() => container.remove());

    test("lets core apply the complete layout after attachment", () => {
        const model = new VirtualScroller({ itemCount: 10 });
        const root = createRoot(container);

        act(() =>
            root.render(
                <VirtualList
                    model={model}
                    style={{ width: 320, backgroundColor: "red" }}
                >
                    {Item}
                </VirtualList>
            )
        );

        const scroller = container.firstElementChild as HTMLElement;
        const sizeElement = scroller.firstElementChild as HTMLElement;
        const itemsElement = sizeElement.firstElementChild as HTMLElement;
        expect(scroller.style.overflow).toBe("auto");
        expect(scroller.style.contain).toBe("strict");
        expect(scroller.style.width).toBe("320px");
        expect(scroller.style.backgroundColor).toBe("red");
        expect(sizeElement.style.height).toBe("400px");
        expect(itemsElement.style.position).toBe("absolute");

        act(() => root.unmount());
    });

    test("preserves keyed item DOM when data order changes", () => {
        let items = [{ id: "a" }, { id: "b" }, { id: "c" }];
        const model = new VirtualScroller({
            itemCount: items.length
        });
        const root = createRoot(container);
        const renderList = () =>
            root.render(
                <VirtualList
                    model={model}
                    itemData={items}
                    getItemKey={index => items[index].id}
                >
                    {KeyedItem}
                </VirtualList>
            );

        act(renderList);
        const retained = container.querySelector('[data-id="a"]');
        items = [items[2], items[1], items[0]];
        act(renderList);

        expect(container.querySelector('[data-id="a"]')).toBe(retained);
        act(() => root.unmount());
    });
});
