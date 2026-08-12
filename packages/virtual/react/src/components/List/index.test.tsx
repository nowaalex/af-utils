// @vitest-environment jsdom

import { VirtualScroller } from "@af-utils/virtual-core";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type { ListItemProps } from "../../types";
import List from ".";

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

describe("List hydration", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.append(container);
    });

    afterEach(() => container.remove());

    test("keeps server-rendered scrolling inert while preserving geometry", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 10
        });

        container.innerHTML = renderToStaticMarkup(
            <List model={model}>{Item}</List>
        );
        const scroller = container.firstElementChild as HTMLElement;
        const sizeElement = scroller.children[0] as HTMLElement;

        expect(scroller.style.overflow).toBe("hidden");
        expect(sizeElement.style.height).toBe("400px");
    });

    test("enables scrolling only after the model is attached", () => {
        const model = new VirtualScroller({ itemCount: 10 });
        const root = createRoot(container);

        act(() => root.render(<List model={model}>{Item}</List>));

        const scroller = container.firstElementChild as HTMLElement;
        expect(scroller.style.overflow).toBe("auto");

        act(() => root.unmount());
    });
});
