<svelte:options runes={true} />

<script lang="ts">
    import { createVirtualList, virtualItem } from "@af-utils/virtual-svelte";
    import css from "./style.module.css";

    const { model, range, size, items } = createVirtualList({
        itemCount: 5_000
    });

    $effect(() => {
        model.setScroller(window);
        return () => model.setScroller(null);
    });
</script>

<div class={css.offset1}>Some offset</div>
<div>
    <div class={css.offset2}>Some offset 2</div>
    <div>
        <div {@attach size} role="list" aria-label="Window virtual list">
            <div {@attach items}>
                {#each range() as index (index)}
                    <div
                        {@attach virtualItem(model, () => index)}
                        class={css.item}
                        role="listitem"
                        aria-posinset={index + 1}
                        aria-setsize={model.itemCount}
                    >
                        row {index}
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
