<svelte:options runes={true} />

<script lang="ts">
    import {
        createVirtual,
        createVirtualList,
        virtualItem
    } from "@af-utils/virtual-svelte";
    import css from "./style.module.css";

    const DEFAULT_ROW_COUNT = 50_000;
    const sizes = Array.from(
        { length: DEFAULT_ROW_COUNT },
        (_, index) => 20 + ((index ** 2) & 31)
    );
    const model = createVirtual({
        itemCount: DEFAULT_ROW_COUNT,
        estimatedItemSize: 75
    });
    const { range, scroller, size, items } = createVirtualList(model);
</script>

<div {@attach scroller} class={css.list} role="list">
    <div {@attach size}>
        <div {@attach items}>
            {#each range.current as index (index)}
                <div
                    {@attach virtualItem(() => ({ model, index }))}
                    class={css.item}
                    role="listitem"
                    aria-posinset={index + 1}
                    aria-setsize={sizes.length}
                    style:padding={`${sizes[index]}px 0`}
                    style:background={`hsl(${(index * 11) % 360},60%,60%)`}
                >
                    row {index}:&nbsp;{sizes[index]}px
                </div>
            {/each}
        </div>
    </div>
</div>
