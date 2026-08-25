<svelte:options runes={true} />

<script lang="ts">
    import { createVirtualList, virtualItem } from "@af-utils/virtual-svelte";
    import css from "./style.module.css";

    const { model, range, scroller, size, items } = createVirtualList({
        itemCount: 5_000
    });
</script>

<div {@attach scroller} class={css.list} role="list">
    <div class={css.offset1}>Some offset</div>
    <div>
        <div class={css.offset2}>Some offset 2</div>
        <div>
            <div {@attach size}>
                <div {@attach items}>
                    {#each range() as index (index)}
                        <div
                            {@attach virtualItem(model, () => index)}
                            class={css.item}
                            role="listitem"
                        >
                            row {index}
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>
</div>
