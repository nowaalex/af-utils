<script lang="ts">
    import {
        createVirtual,
        createVirtualList,
        virtualItem,
        virtualStickyHeader
    } from "@af-utils/virtual-svelte";
    import css from "./style.module.css";

    const INITIAL_ITEM_COUNT = 10_000;
    const PREPEND_BATCH_SIZE = 100;
    const SIMULATED_FETCH_DELAY_MS = 500;
    const MIN_ITEM_PADDING_PX = 20;
    const ITEM_PADDING_VARIANTS = 61;
    const ITEM_PADDING_STEP = 37;
    const ESTIMATED_ITEM_SIZE_PX = 120;

    const createItem = (id: number) => ({
        name: id < 0 ? `Prepended person ${-id}` : `Person ${id}`,
        id,
        height:
            MIN_ITEM_PADDING_PX +
            ((Math.abs(id) * ITEM_PADDING_STEP) % ITEM_PADDING_VARIANTS)
    });
    const waitForPrependRequest = () =>
        new Promise<void>((resolve) => {
            setTimeout(resolve, SIMULATED_FETCH_DELAY_MS);
        });

    let itemData = Array.from({ length: INITIAL_ITEM_COUNT }, (_, id) =>
        createItem(id)
    );
    let loading = false;
    let nextPrependedId = -1;
    const model = createVirtual({
        estimatedItemSize: ESTIMATED_ITEM_SIZE_PX,
        itemCount: itemData.length
    });
    const {
        range,
        scroller,
        size,
        items,
        scrollerStyle,
        sizeStyle,
        itemsStyle
    } = createVirtualList(model);

    const prependItems = async () => {
        loading = true;
        await waitForPrependRequest();
        const newItems = Array.from({ length: PREPEND_BATCH_SIZE }, () =>
            createItem(nextPrependedId--)
        );
        const desiredScrollPosition = newItems.length + model.visibleFrom;
        model.spliceItems(0, 0, newItems.length);
        itemData = [...newItems, ...itemData];
        model.scrollToIndex(desiredScrollPosition);
        loading = false;
    };
</script>

<div
    use:scroller
    style={scrollerStyle}
    role="list"
    aria-label="Prepend items list"
>
    <div use:virtualStickyHeader={model} class={css.listHeader}>
        <button
            type="button"
            class={css.prependButton}
            onclick={() => void prependItems()}
            disabled={loading}
        >
            Prepend {PREPEND_BATCH_SIZE} items{loading ? " (loading...)" : ""}
        </button>
    </div>
    <div use:size style={sizeStyle}>
        <div use:items style={itemsStyle}>
            {#each $range as index (itemData[index]?.id ?? index)}
                <div
                    use:virtualItem={{ model, index }}
                    class={css.item}
                    role="listitem"
                    aria-posinset={index + 1}
                    aria-setsize={model.itemCount}
                    style:padding={`${itemData[index]?.height}px 0.5em`}
                >
                    Idx:&nbsp;{index};&emsp;{itemData[index]?.name}
                </div>
            {/each}
        </div>
    </div>
</div>
