import { VirtualScroller, VirtualScrollerEvent } from "@af-utils/virtual-core";
import { flushSync } from "svelte";
import { expect, test, vi } from "vitest";
import { createVirtual, createVirtualSnapshot, virtualGridItem } from "./index";

test("synchronizes rune parameters, snapshots, and lifecycle", () => {
    let itemCount = $state(3);
    let model!: VirtualScroller;
    let revision = -1;

    const cleanup = $effect.root(() => {
        model = createVirtual(() => ({ itemCount }));
        const snapshot = createVirtualSnapshot(
            model,
            VirtualScrollerEvent.SCROLL_SIZE
        );

        $effect(() => {
            revision = snapshot();
        });
    });

    itemCount = 4;
    flushSync();
    const initialRevision = revision;
    expect(model.itemCount).toBe(4);

    itemCount = 5;
    flushSync();
    expect(model.itemCount).toBe(5);
    expect(revision).toBeGreaterThan(initialRevision);

    cleanup();
    expect(() => model.setItemCount(6)).toThrow();
});

test("keeps an unchanged reactive grid binding attached", () => {
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
    let rowIndex = $state(0);
    let columnIndex = $state(0);
    const lifecycle: { detach: (() => void) | null } = { detach: null };

    const cleanup = $effect.root(() => {
        lifecycle.detach =
            virtualGridItem(
                rows,
                () => rowIndex,
                columns,
                () => columnIndex
            )(element) ?? null;
    });
    flushSync();

    rowIndex = 0;
    columnIndex = 0;
    flushSync();
    expect(rowsAttach).toHaveBeenCalledOnce();
    expect(columnsAttach).toHaveBeenCalledOnce();
    expect(rowsDetach).not.toHaveBeenCalled();
    expect(columnsDetach).not.toHaveBeenCalled();

    lifecycle.detach?.();
    cleanup();
    rows.dispose();
    columns.dispose();
});
