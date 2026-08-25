<svelte:options runes={true} />

<script lang="ts">
    import { VirtualScrollerEvent } from "@af-utils/virtual-core";
    import {
        createVirtualList,
        createVirtualSnapshot,
        virtualItem,
        virtualStickyFooter,
        virtualStickyHeader
    } from "@af-utils/virtual-svelte";
    import css from "./style.module.css";

    const {
        model: rows,
        range,
        scroller,
        size,
        items
    } = createVirtualList({
        itemCount: 150_000,
        estimatedItemSize: 35
    });
    const rangeRevision = createVirtualSnapshot(
        rows,
        VirtualScrollerEvent.RANGE
    );
    const scrollSizeRevision = createVirtualSnapshot(
        rows,
        VirtualScrollerEvent.SCROLL_SIZE
    );

    const rangeInfo = $derived.by(() => {
        void rangeRevision();
        return `Rendered ${rows.to - rows.from} items. Range: ${rows.from} - ${rows.to}`;
    });
    const scrollSize = $derived.by(() => {
        void scrollSizeRevision();
        return rows.scrollSize;
    });
</script>

<div {@attach scroller} role="list" aria-label="Extra events list">
    <div {@attach virtualStickyHeader(rows)} class={`${css.row} ${css.top0}`}>
        {rangeInfo}
    </div>
    <div {@attach size}>
        <div {@attach items}>
            {#each range() as index (index)}
                <div
                    {@attach virtualItem(rows, () => index)}
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
    <div
        {@attach virtualStickyFooter(rows)}
        class={`${css.row} ${css.bottom0}`}
    >
        Scroll size: {scrollSize}px
    </div>
</div>
