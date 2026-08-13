// @vitest-environment jsdom

import {
    VirtualScroller,
    type VirtualScrollerError,
    VirtualScrollerErrorCode
} from "@af-utils/virtual-core";
import { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import useVirtualLayout from ".";

class NoopResizeObserver implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

globalThis.ResizeObserver = NoopResizeObserver;
(
    globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const StableModelHarness = ({ model }: { model: VirtualScroller }) => {
    useVirtualLayout(model);
    return null;
};

describe("useVirtualLayout", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.append(container);
    });

    afterEach(() => container.remove());

    test("syncs layout styles without a React rerender", () => {
        const model = new VirtualScroller({ itemCount: 10 });
        const root = createRoot(container);
        const setContainerSpy = vi.spyOn(model, "setContainer");
        let renders = 0;

        const Harness = () => {
            renders++;
            const { sizeRef, itemsRef } = useVirtualLayout(model);
            return (
                <div ref={sizeRef} data-testid="size">
                    <div ref={itemsRef} data-testid="items" />
                </div>
            );
        };

        act(() => root.render(<Harness />));
        const size = container.firstElementChild as HTMLElement;
        const items = size.firstElementChild;
        expect(renders).toBe(1);
        expect(size.style.height).toBe("400px");
        expect(setContainerSpy).toHaveBeenCalledWith(size);
        expect(setContainerSpy).not.toHaveBeenCalledWith(items);

        act(() => model.setItemCount(20));
        expect(size.style.height).toBe("800px");
        expect(renders).toBe(1);

        act(() => root.unmount());
    });

    test("applies the complete layout geometry through client refs", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 10
        });
        const root = createRoot(container);

        const Harness = () => {
            const { scrollerRef, sizeRef, itemsRef } = useVirtualLayout(model);
            return (
                <div ref={scrollerRef} data-testid="scroller">
                    <div ref={sizeRef} data-testid="size">
                        <div ref={itemsRef} data-testid="items" />
                    </div>
                </div>
            );
        };

        act(() => root.render(<Harness />));
        const scroller = container.firstElementChild as HTMLElement;
        const size = scroller.firstElementChild as HTMLElement;
        const items = size.firstElementChild as HTMLElement;

        expect(scroller.style.overflow).toBe("auto");
        expect(scroller.style.contain).toBe("strict");
        expect(size.style.height).toBe("400px");
        expect(size.style.position).toBe("relative");
        expect(size.style.contain).toBe("size layout style");
        expect(items.style.height).toBe("400px");
        expect(items.style.position).toBe("absolute");
        expect(items.style.contain).toBe("size layout style");
        expect(items.style.overflow).toBe("");
        expect(items.style.top).toBe("0px");
        expect(items.style.transform).toBe("translate3d(0px, 0px, 0px)");
        act(() => root.unmount());
    });

    test("keeps the layout connected through StrictMode replay", () => {
        const model = new VirtualScroller({ itemCount: 10 });
        const root = createRoot(container);

        const Harness = () => {
            const { sizeRef, itemsRef } = useVirtualLayout(model);
            return (
                <div ref={sizeRef}>
                    <div ref={itemsRef} />
                </div>
            );
        };

        act(() =>
            root.render(
                <StrictMode>
                    <Harness />
                </StrictMode>
            )
        );
        const size = container.firstElementChild as HTMLElement;
        act(() => model.setItemCount(20));
        expect(size.style.height).toBe("800px");
        act(() => root.unmount());
    });

    test("rejects replacing the model without remounting", () => {
        const first = new VirtualScroller({ itemCount: 10 });
        const second = new VirtualScroller({ itemCount: 20 });
        const root = createRoot(container);

        act(() => root.render(<StableModelHarness model={first} />));
        expect(() =>
            act(() => root.render(<StableModelHarness model={second} />))
        ).toThrow(
            expect.objectContaining<Partial<VirtualScrollerError>>({
                code: VirtualScrollerErrorCode[13],
                message: expect.stringContaining(
                    "useVirtualLayout requires a stable VirtualScroller"
                )
            })
        );
        act(() => root.unmount());
    });
});
