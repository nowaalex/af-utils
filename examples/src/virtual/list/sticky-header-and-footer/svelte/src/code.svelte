<svelte:options runes={true} />

<script lang="ts">
    import {
        createVirtual,
        createVirtualList,
        virtualItem,
        virtualStickyFooter,
        virtualStickyHeader
    } from "@af-utils/virtual-svelte";
    import css from "./style.module.css";

    const rows = createVirtual({ itemCount: 200_000 });
    const { range, scroller, size, items } = createVirtualList(rows);
</script>

<div {@attach scroller} role="list" aria-label="Sticky header and footer list">
    <div
        {@attach virtualStickyHeader(rows)}
        class={css.header}
        data-testid="sticky-header"
    >
        Header
    </div>
    <div {@attach size}>
        <div {@attach items}>
            {#each range.current as index (index)}
                <div
                    {@attach virtualItem(() => ({ model: rows, index }))}
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
        class={css.footer}
        data-testid="sticky-footer"
    >
        Footer
    </div>
</div>
