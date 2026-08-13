<script lang="ts">
    import {
        createVirtual,
        createVirtualLayout,
        createVirtualRange,
        virtualItem
    } from "@af-utils/virtual-svelte";
    import { onMount } from "svelte";
    import css from "./style.module.css";

    const model = createVirtual({ itemCount: 5_000 });
    const range = createVirtualRange(model);
    const { size, items } = createVirtualLayout(model);

    onMount(() => {
        model.setScroller(window);
        return () => model.setScroller(null);
    });
</script>

<div class={css.offset1}>Some offset</div>
<div>
    <div class={css.offset2}>Some offset 2</div>
    <div>
        <div use:size>
            <div use:items>
                {#each $range as index (index)}
                    <div use:virtualItem={{ model, index }} class={css.item}>
                        row {index}
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
