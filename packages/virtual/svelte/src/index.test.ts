import { VirtualScroller } from "@af-utils/virtual-core";
import { describe, expect, test, vi } from "vitest";
import { virtualGridItem, virtualItem } from "./index";

describe("Svelte adapter", () => {
    test("attaches and detaches a virtual item attachment", () => {
        const first = new VirtualScroller({ itemCount: 2 });
        const element = document.createElement("div");
        const firstAttach = vi.spyOn(first, "attachItem");
        const firstDetach = vi.spyOn(first, "detachItem");

        const detach = virtualItem(first, 0)(element);
        expect(firstAttach).toHaveBeenCalledWith(element, 0);
        detach?.();
        expect(firstDetach).toHaveBeenCalledWith(element);

        first.dispose();
    });

    test("attaches and detaches both virtual grid dimensions", () => {
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
        const detach = virtualGridItem(rows, 0, columns, 0)(element);

        expect(rowsAttach).toHaveBeenCalledOnce();
        expect(columnsAttach).toHaveBeenCalledOnce();
        expect(rowsDetach).not.toHaveBeenCalled();
        expect(columnsDetach).not.toHaveBeenCalled();

        detach?.();
        expect(rowsDetach).toHaveBeenCalledOnce();
        expect(columnsDetach).toHaveBeenCalledOnce();

        rows.dispose();
        columns.dispose();
    });
});
