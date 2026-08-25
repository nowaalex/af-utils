<svelte:options runes={true} />

<script lang="ts">
    import { createVirtualList, virtualItem } from "@af-utils/virtual-svelte";
    import css from "./style.module.css";

    const {
        model: columns,
        range,
        scroller,
        size,
        items
    } = createVirtualList({
        itemCount: 50_000,
        estimatedItemSize: 75,
        horizontal: true
    });
</script>

<div {@attach scroller} role="list" aria-label="Horizontal virtual list">
    <div {@attach size}>
        <div {@attach items}>
            {#each range() as index (index)}
                <div
                    {@attach virtualItem(columns, () => index)}
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
