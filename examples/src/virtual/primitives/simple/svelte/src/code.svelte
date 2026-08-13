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
    use:scroller
    class={css.list}
    role="list"
    aria-label="Simple primitives list"
>
    <div use:size>
        <div use:items>
            {#each $range as index (index)}
                <div
                    use:virtualItem={{ model, index }}
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
