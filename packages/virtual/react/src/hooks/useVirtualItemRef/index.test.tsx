// @vitest-environment jsdom

import { VirtualScroller } from "@af-utils/virtual-core";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useVirtualItemRef } from ".";

class NoopResizeObserver implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

globalThis.ResizeObserver = NoopResizeObserver;
(
    globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;

beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
});

afterEach(() => container.remove());

test("uses React ref cleanup for measured items", () => {
    const model = new VirtualScroller({ itemCount: 1 });
    const root = createRoot(container);
    const attachSpy = vi.spyOn(model, "attachItem");
    const detachSpy = vi.spyOn(model, "detachItem");

    const Item = () => <div ref={useVirtualItemRef(model, 0)} />;
    act(() => root.render(<Item />));
    const element = container.firstElementChild;
    expect(attachSpy).toHaveBeenCalledWith(element, 0);

    act(() => root.unmount());
    expect(detachSpy).toHaveBeenCalledWith(element);
});
