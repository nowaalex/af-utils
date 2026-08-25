<svelte:options runes={true} />

<script lang="ts">
    import { createVirtualList, virtualItem } from "@af-utils/virtual-svelte";

    const {
        model: rows,
        range,
        scroller,
        size,
        items
    } = createVirtualList({
        itemCount: 150_000
    });
</script>

<div {@attach scroller} role="list" aria-label="Simple virtual list">
    <div {@attach size}>
        <div {@attach items}>
            {#each range() as index (index)}
                <div
                    {@attach virtualItem(rows, () => index)}
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
