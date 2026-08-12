// @vitest-environment jsdom

import { VirtualScroller, VirtualScrollerEvent } from "@af-utils/virtual-core";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import useVirtualSnapshot from ".";

(
    globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe("useVirtualSnapshot", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.append(container);
    });

    afterEach(() => container.remove());

    test("keeps a bitmask subscription stable", () => {
        const model = new VirtualScroller({ itemCount: 10 });
        const originalSubscribe = model.subscribe.bind(model);
        const subscribeSpy = vi
            .spyOn(model, "subscribe")
            .mockImplementation((callback, events) =>
                originalSubscribe(callback, events)
            );
        const root = createRoot(container);
        let renders = 0;

        const Harness = ({ value }: { value: number }) => {
            renders++;
            useVirtualSnapshot(model, VirtualScrollerEvent.SCROLL_SIZE);
            return value;
        };

        act(() => root.render(<Harness value={0} />));
        act(() => root.render(<Harness value={1} />));
        expect(subscribeSpy).toHaveBeenCalledTimes(1);

        act(() => model.setItemCount(20));
        expect(renders).toBe(3);
        act(() => root.unmount());
    });

    test("detects a change before an external-store subscription", () => {
        const model = new VirtualScroller({ itemCount: 10 });
        const before = model.getRevision(VirtualScrollerEvent.SCROLL_SIZE);
        model.setItemCount(20);
        const after = model.getRevision(VirtualScrollerEvent.SCROLL_SIZE);

        expect(after).toBeGreaterThan(before);
        expect(model.getRevision(VirtualScrollerEvent.SCROLL_SIZE)).toBe(after);
    });
});
