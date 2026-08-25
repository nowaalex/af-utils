// @vitest-environment jsdom

import { act, StrictMode, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, test, vi } from "vitest";
import useVirtual from ".";

(
    globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe("useVirtual", () => {
    test("keeps the committed model through StrictMode replay and disposes it", async () => {
        const container = document.createElement("div");
        const root = createRoot(container);
        const observeModel =
            vi.fn<(model: ReturnType<typeof useVirtual>) => void>();

        const Harness = () => {
            const model = useVirtual({ itemCount: 10 });
            useLayoutEffect(() => {
                observeModel(model);
            }, [model]);
            return null;
        };

        act(() =>
            root.render(
                <StrictMode>
                    <Harness />
                </StrictMode>
            )
        );
        const model = observeModel.mock.lastCall?.[0];
        if (!model) throw new Error("StrictMode did not commit the model");
        const dispose = vi.spyOn(model, "dispose");
        await act(() => Promise.resolve());
        expect(dispose).not.toHaveBeenCalled();

        act(() => root.unmount());
        await act(() => Promise.resolve());
        expect(dispose).toHaveBeenCalledOnce();
    });
});
