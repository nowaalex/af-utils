<svelte:options runes={true} />

<script lang="ts">
    import {
        createVirtual,
        createVirtualList,
        virtualItem
    } from "@af-utils/virtual-svelte";

    const rows = createVirtual({ itemCount: 150_000 });
    const { range, scroller, size, items } = createVirtualList(rows);
</script>

<div {@attach scroller} role="list" aria-label="Simple virtual list">
    <div {@attach size}>
        <div {@attach items}>
            {#each range.current as index (index)}
                <div
                    {@attach virtualItem(() => ({ model: rows, index }))}
                    role="listitem"
                    aria-posinset={index + 1}
                    aria-setsize={rows.itemCount}
                    style="border-top: 2px solid #ccc; padding: 0.6em"
                >
                    row {index}
                </div>
            {/each}
        </div>
    </div>
</div>
