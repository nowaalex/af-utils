<svelte:options runes={true} />

<script lang="ts">
    import {
        createVirtual,
        createVirtualLayout,
        createVirtualRange,
        virtualItem
    } from "@af-utils/virtual-svelte";
    import css from "./style.module.css";

    const model = createVirtual({ itemCount: 50_000 });
    const range = createVirtualRange(model);
    const { scroller, size, items } = createVirtualLayout(model);
</script>

<div
    {@attach scroller}
    class={css.list}
    role="list"
    aria-label="Simple primitives list"
>
    <div {@attach size}>
        <div {@attach items}>
            {#each range.current as index (index)}
                <div
                    {@attach virtualItem(() => ({ model, index }))}
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
