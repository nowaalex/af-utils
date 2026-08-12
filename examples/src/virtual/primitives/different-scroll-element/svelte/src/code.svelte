<script lang="ts">
    import {
        createVirtual,
        createVirtualLayout,
        createVirtualRange,
        virtualItem
    } from "@af-utils/virtual-svelte";
    import css from "./style.module.css";

    const model = createVirtual({ itemCount: 5_000 });
    const range = createVirtualRange(model);
    const { scroller, size, items, scrollerStyle, sizeStyle, itemsStyle } =
        createVirtualLayout(model);
</script>

<div use:scroller class={css.list} role="list" style={scrollerStyle}>
    <div class={css.offset1}>Some offset</div>
    <div>
        <div class={css.offset2}>Some offset 2</div>
        <div>
            <div use:size style={sizeStyle}>
                <div use:items style={itemsStyle}>
                    {#each $range as index (index)}
                        <div
                            use:virtualItem={{ model, index }}
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
