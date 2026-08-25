<svelte:options runes={true} />

<script lang="ts">
    import {
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

    let itemData = $state(
        Array.from({ length: INITIAL_ITEM_COUNT }, (_, id) => createItem(id))
    );
    let loading = $state(false);
    let nextPrependedId = $state(-1);
    const { model, range, scroller, size, items } = createVirtualList({
        estimatedItemSize: ESTIMATED_ITEM_SIZE_PX,
        itemCount: INITIAL_ITEM_COUNT
    });

    const prependItems = async () => {
        loading = true;
        await waitForPrependRequest();
        const newItems = Array.from({ length: PREPEND_BATCH_SIZE }, () =>
            createItem(nextPrependedId--)
        );
        const desiredScrollPosition = newItems.length + model.visibleFrom;
        itemData = [...newItems, ...itemData];
        model.spliceItems(0, 0, newItems.length);
        model.scrollToIndex(desiredScrollPosition);
        loading = false;
    };
</script>

<div {@attach scroller} role="list" aria-label="Prepend items list">
    <div {@attach virtualStickyHeader(model)} class={css.listHeader}>
        <button
            type="button"
            class={css.prependButton}
            onclick={() => void prependItems()}
            disabled={loading}
        >
            Prepend {PREPEND_BATCH_SIZE} items{loading ? " (loading...)" : ""}
        </button>
    </div>
    <div {@attach size}>
        <div {@attach items}>
            {#each range() as index (itemData[index]?.id ?? index)}
                <div
                    {@attach virtualItem(model, () => index)}
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
