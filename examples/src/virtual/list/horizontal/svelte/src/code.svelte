<svelte:options runes={true} />

<script lang="ts">
    import {
        createVirtual,
        createVirtualList,
        virtualItem
    } from "@af-utils/virtual-svelte";
    import css from "./style.module.css";

    const columns = createVirtual({
        itemCount: 50_000,
        estimatedItemSize: 75,
        horizontal: true
    });
    const { range, scroller, size, items } = createVirtualList(columns);
</script>

<div {@attach scroller} role="list" aria-label="Horizontal virtual list">
    <div {@attach size}>
        <div {@attach items}>
            {#each range.current as index (index)}
                <div
                    {@attach virtualItem(() => ({ model: columns, index }))}
                    class={index % 2 ? css.oddItem : css.evenItem}
                    role="listitem"
                    aria-posinset={index + 1}
                    aria-setsize={columns.itemCount}
                >
                    col&nbsp;{index}
                </div>
            {/each}
        </div>
    </div>
</div>
