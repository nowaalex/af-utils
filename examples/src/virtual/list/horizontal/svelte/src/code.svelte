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
    const {
        range,
        scroller,
        size,
        items,
        scrollerStyle,
        sizeStyle,
        itemsStyle
    } = createVirtualList(columns);
</script>

<div use:scroller style={scrollerStyle}>
    <div use:size style={sizeStyle}>
        <div use:items style={itemsStyle}>
            {#each $range as index (index)}
                <div
                    use:virtualItem={{ model: columns, index }}
                    class={index % 2 ? css.oddItem : css.evenItem}
                >
                    col&nbsp;{index}
                </div>
            {/each}
        </div>
    </div>
</div>
