// @vitest-environment jsdom

import { VirtualScroller } from "@af-utils/virtual-core";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { bench, describe } from "vitest";
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

const ITEM_COUNT = 100_000;
const ESTIMATED_ITEM_SIZE = 40;
const ESTIMATED_WIDGET_SIZE = 600;

const Item = ({ index }: ListItemProps) => <div>Item {index}</div>;
const KeyedItem = ({ index, data }: ListItemProps<readonly string[]>) => (
    <div data-id={data?.[index]}>{data?.[index]}</div>
);

const createModel = () =>
    new VirtualScroller({
        estimatedItemSize: ESTIMATED_ITEM_SIZE,
        estimatedWidgetSize: ESTIMATED_WIDGET_SIZE,
        itemCount: ITEM_COUNT
    });

const withContainer = (run: (container: HTMLDivElement) => void) => {
    const container = document.createElement("div");
    document.body.append(container);
    run(container);
    container.remove();
};

describe("VirtualList mount", () => {
    bench("mount and unmount a 100k-item list", () => {
        withContainer(container => {
            const model = createModel();
            const root = createRoot(container);

            act(() =>
                root.render(<VirtualList model={model}>{Item}</VirtualList>)
            );
            act(() => root.unmount());
            model.dispose();
        });
    });
});

describe("VirtualList updates", () => {
    const data = Array.from(
        { length: ITEM_COUNT },
        (_, index) => `id-${index}`
    );
    const getItemKey = (index: number) => data[index];

    bench("re-render keyed rows 20 times", () => {
        withContainer(container => {
            const model = createModel();
            const root = createRoot(container);
            const renderList = () =>
                root.render(
                    <VirtualList
                        model={model}
                        itemData={data}
                        getItemKey={getItemKey}
                    >
                        {KeyedItem}
                    </VirtualList>
                );

            for (let render = 0; render < 20; render++) {
                act(renderList);
            }

            act(() => root.unmount());
            model.dispose();
        });
    });
});
