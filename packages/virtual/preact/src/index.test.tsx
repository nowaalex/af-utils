import { VirtualScrollerEvent } from "@af-utils/virtual-core";
import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, test, vi } from "vitest";
import useVirtual from "./hooks/useVirtual";
import useVirtualSnapshot from "./hooks/useVirtualSnapshot";

let container: HTMLDivElement;

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

        act(() => render(<App />, container));
        expect(model?.itemCount).toBe(3);
        const dispose = vi.spyOn(model!, "dispose");

        itemCount = 7;
        act(() => render(<App />, container));
        expect(model?.itemCount).toBe(7);

        act(() => render(null, container));
        expect(dispose).toHaveBeenCalledOnce();
    });

    test("subscribes to the selected revision", () => {
        container = document.createElement("div");
        let model: ReturnType<typeof useVirtual> | undefined;

        const App = () => {
            model = useVirtual({ itemCount: 3 });
            return (
                <output>
                    {useVirtualSnapshot(
                        model,
                        VirtualScrollerEvent.SCROLL_SIZE
                    )}
                </output>
            );
        };

        act(() => render(<App />, container));
        const initial = container.textContent;
        act(() => model?.setItemCount(4));
        expect(Number(container.textContent)).toBe(Number(initial) + 1);
    });
});
