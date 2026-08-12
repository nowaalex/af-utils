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
    const { scroller, size, items, scrollerStyle, sizeStyle, itemsStyle } =
        createVirtualLayout(model);
</script>

<div
    use:scroller
    style={scrollerStyle}
    class={css.list}
    role="list"
    aria-label="Simple primitives list"
>
    <div use:size style={sizeStyle}>
        <div use:items style={itemsStyle}>
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
