import { VirtualScroller, VirtualScrollerEvent } from "@af-utils/virtual-core";
import { describe, expect, test, vi } from "vitest";
import { createVirtualSnapshot, virtualGridItem, virtualItem } from ".";

describe("Svelte adapter", () => {
    test("exposes selected model revisions as a readable store", () => {
        const model = new VirtualScroller({ itemCount: 3 });
        const revision = createVirtualSnapshot(
            model,
            VirtualScrollerEvent.SCROLL_SIZE
        );
        let current = -1;
        const unsubscribe = revision.subscribe(value => {
            current = value;
        });
        const initial = current;

        model.setItemCount(5);
        expect(current).toBeGreaterThan(initial);
        unsubscribe();
        model.dispose();
    });

    test("attaches, updates, and detaches a virtual item action", () => {
        const first = new VirtualScroller({ itemCount: 2 });
        const second = new VirtualScroller({ itemCount: 2 });
        const element = document.createElement("div");
        const firstAttach = vi.spyOn(first, "attachItem");
        const firstDetach = vi.spyOn(first, "detachItem");
        const secondAttach = vi.spyOn(second, "attachItem");
        const secondDetach = vi.spyOn(second, "detachItem");

        const action = virtualItem(element, { model: first, index: 0 });
        expect(firstAttach).toHaveBeenCalledWith(element, 0);
        action?.update?.({ model: second, index: 1 });
        expect(firstDetach).toHaveBeenCalledWith(element);
        expect(secondAttach).toHaveBeenCalledWith(element, 1);
        action?.destroy?.();
        expect(secondDetach).toHaveBeenCalledWith(element);

        first.dispose();
        second.dispose();
    });

    test("does not reattach an unchanged virtual grid item binding", () => {
        const rows = new VirtualScroller({ itemCount: 2 });
        const columns = new VirtualScroller({
            itemCount: 2,
            horizontal: true
        });
        const element = document.createElement("div");
        const rowsAttach = vi.spyOn(rows, "attachItem");
        const rowsDetach = vi.spyOn(rows, "detachItem");
        const columnsAttach = vi.spyOn(columns, "attachItem");
        const columnsDetach = vi.spyOn(columns, "detachItem");
        const binding = { rows, rowIndex: 0, columns, columnIndex: 0 };

        const action = virtualGridItem(element, binding);
        action?.update?.({ ...binding });

        expect(rowsAttach).toHaveBeenCalledOnce();
        expect(columnsAttach).toHaveBeenCalledOnce();
        expect(rowsDetach).not.toHaveBeenCalled();
        expect(columnsDetach).not.toHaveBeenCalled();

        action?.destroy?.();
        expect(rowsDetach).toHaveBeenCalledOnce();
        expect(columnsDetach).toHaveBeenCalledOnce();

        rows.dispose();
        columns.dispose();
    });
});
