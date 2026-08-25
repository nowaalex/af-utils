<svelte:options runes={true} />

<script lang="ts">
    import {
        mapVirtualRangeWithOffset,
        type VirtualScroller,
        VirtualScrollerEvent
    } from "@af-utils/virtual-core";
    import {
        createVirtual,
        createVirtualSnapshot,
        virtualGridItem
    } from "@af-utils/virtual-svelte";
    import type { Attachment } from "svelte/attachments";
    import css from "./style.module.css";

    const SIZE = 50_000;
    const rows = createVirtual({
        itemCount: SIZE,
        estimatedItemSize: 120,
        overscanCount: 2
    });
    const columns = createVirtual({
        itemCount: SIZE,
        estimatedItemSize: 200,
        overscanCount: 2,
        horizontal: true
    });
    const rowRevision = createVirtualSnapshot(rows, VirtualScrollerEvent.ALL);
    const columnRevision = createVirtualSnapshot(
        columns,
        VirtualScrollerEvent.ALL
    );
    const cells = $derived.by(() => {
        void rowRevision();
        void columnRevision();
        return mapVirtualRangeWithOffset(rows, (row, rowOffset) =>
            mapVirtualRangeWithOffset(columns, (column, columnOffset) => ({
                column,
                columnOffset,
                row,
                rowOffset
            }))
        ).flat();
    });

    const gridScroller: Attachment<HTMLElement> = (element) => {
        rows.setScroller(element);
        columns.setScroller(element);
        return () => {
            rows.setScroller(null);
            columns.setScroller(null);
        };
    };

    const scrollModelTo = (model: VirtualScroller, value: string) => {
        const index = Number.parseInt(value, 10);
        if (!Number.isNaN(index)) {
            model.scrollToIndex(index, { behavior: "smooth" });
        }
    };
    const submit = (event: SubmitEvent) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget as HTMLFormElement);
        scrollModelTo(
            form.get("type") === "row" ? rows : columns,
            String(form.get("index") ?? "")
        );
    };
</script>

<div class={css.root}>
    <form class={css.form} onsubmit={submit}>
        <select name="type">
            <option value="row">Row</option>
            <option value="col">Col</option>
        </select>
        <input
            placeholder="index"
            type="number"
            name="index"
            min={0}
            max={SIZE - 1}
            class="w-28"
        />
        <button type="submit" class={css.btn}>Scroll</button>
    </form>
    <div class={css.grid} {@attach gridScroller} data-testid="virtual-grid">
        <div
            class={css.gridItems}
            style:height={`${rows.scrollSize}px`}
            style:width={`${columns.scrollSize}px`}
        >
            {#each cells as cell (`${cell.row}:${cell.column}`)}
                <div
                    {@attach virtualGridItem(
                        rows,
                        () => cell.row,
                        columns,
                        () => cell.column
                    )}
                    class={css.cell}
                    data-row-index={cell.row}
                    data-column-index={cell.column}
                    style:width={`${Math.max(cell.column ** 2 % 256, 190)}px`}
                    style:padding={`${Math.max(cell.row ** 2 % 64, 30)}px 0`}
                    style:transform={`translateX(${cell.columnOffset}px) translateY(${cell.rowOffset}px)`}
                >
                    <div class={css.cellContent}>
                        <span>row:</span>
                        {cell.row}
                        <span>col:</span>
                        {cell.column}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>
