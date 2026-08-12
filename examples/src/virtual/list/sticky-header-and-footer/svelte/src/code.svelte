<script lang="ts">
    import {
        createVirtual,
        createVirtualList,
        virtualItem,
        virtualStickyFooter,
        virtualStickyHeader
    } from "@af-utils/virtual-svelte";
    import css from "./style.module.css";

    const rows = createVirtual({ itemCount: 200_000 });
    const {
        range,
        scroller,
        size,
        items,
        scrollerStyle,
        sizeStyle,
        itemsStyle
    } = createVirtualList(rows);
</script>

<div
    use:scroller
    style={scrollerStyle}
    role="list"
    aria-label="Sticky header and footer list"
>
    <div
        use:virtualStickyHeader={rows}
        class={css.header}
        data-testid="sticky-header"
    >
        Header
    </div>
    <div use:size style={sizeStyle}>
        <div use:items style={itemsStyle}>
            {#each $range as index (index)}
                <div
                    use:virtualItem={{ model: rows, index }}
                    class={css.item}
                    role="listitem"
                    aria-posinset={index + 1}
                    aria-setsize={rows.itemCount}
                >
                    row {index}
                </div>
            {/each}
        </div>
    </div>
    <div
        use:virtualStickyFooter={rows}
        class={css.footer}
        data-testid="sticky-footer"
    >
        Footer
    </div>
</div>
