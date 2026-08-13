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

<div use:scroller role="list" aria-label="Horizontal virtual list">
    <div use:size>
        <div use:items>
            {#each $range as index (index)}
                <div
                    use:virtualItem={{ model: columns, index }}
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
