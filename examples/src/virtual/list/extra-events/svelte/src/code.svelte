<script lang="ts">
    import { VirtualScrollerEvent } from "@af-utils/virtual-core";
    import {
        createVirtual,
        createVirtualList,
        createVirtualSnapshot,
        virtualItem,
        virtualStickyFooter,
        virtualStickyHeader
    } from "@af-utils/virtual-svelte";
    import { derived } from "svelte/store";
    import css from "./style.module.css";

    const rows = createVirtual({
        itemCount: 150_000,
        estimatedItemSize: 35
    });
    const { range, scroller, size, items } = createVirtualList(rows);
    const rangeRevision = createVirtualSnapshot(
        rows,
        VirtualScrollerEvent.RANGE
    );
    const scrollSizeRevision = createVirtualSnapshot(
        rows,
        VirtualScrollerEvent.SCROLL_SIZE
    );

    const rangeInfo = derived(
        rangeRevision,
        () =>
            `Rendered ${rows.to - rows.from} items. Range: ${rows.from} - ${rows.to}`
    );
    const scrollSize = derived(scrollSizeRevision, () => rows.scrollSize);
</script>

<div use:scroller role="list" aria-label="Extra events list">
    <div use:virtualStickyHeader={rows} class={`${css.row} ${css.top0}`}>
        {$rangeInfo}
    </div>
    <div use:size>
        <div use:items>
            {#each $range as index (index)}
                <div
                    use:virtualItem={{ model: rows, index }}
                    class={css.item}
                    role="listitem"
                    aria-posinset={index + 1}
                    aria-setsize={rows.itemCount}
                >
                    row {index}
                </div>
            {/each}
        </div>
    </div>
    <div use:virtualStickyFooter={rows} class={`${css.row} ${css.bottom0}`}>
        Scroll size: {$scrollSize}px
    </div>
</div>
