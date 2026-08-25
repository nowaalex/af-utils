<svelte:options runes={true} />

<script lang="ts">
    import {
        createVirtualList,
        virtualItem,
        virtualStickyFooter,
        virtualStickyHeader
    } from "@af-utils/virtual-svelte";
    import Footer from "./Footer.svelte";
    import Header from "./Header.svelte";
    import css from "./style.module.css";

    const DEFAULT_ROW_COUNT = 50_000;
    const MAX_ROW_COUNT = 100_000;
    let sizes = $state(
        Array.from(
            { length: DEFAULT_ROW_COUNT },
            (_, index) => 20 + ((index ** 2) & 31)
        )
    );
    const { model, range, scroller, size, items } = createVirtualList({
        itemCount: DEFAULT_ROW_COUNT,
        estimatedItemSize: 78
    });

    const changeRows = (rowsToAdd: number) => {
        if (rowsToAdd !== 0) {
            sizes =
                rowsToAdd > 0
                    ? sizes.concat(
                          Array.from(
                              { length: rowsToAdd },
                              (_, index) => 50 + ((index ** 2) & 63)
                          )
                      )
                    : sizes.slice(0, rowsToAdd);
            model.setItemCount(sizes.length);
        }
        model.scrollToIndex(sizes.length - 1);
    };

    $effect(() => {
        model.scrollToIndex(DEFAULT_ROW_COUNT - 1);
    });
</script>

<div {@attach scroller} class={css.list} role="list" tabindex="-1">
    <Header
        attachment={virtualStickyHeader(model)}
        initialIndex={Math.round(sizes.length / 2)}
        maxIndex={sizes.length - 1}
        onScroll={(index) => model.scrollToIndex(index, { behavior: "smooth" })}
    />
    <div {@attach size}>
        <div {@attach items}>
            {#each range() as index (index)}
                <div
                    {@attach virtualItem(model, () => index)}
                    class={css.item}
                    role="listitem"
                    aria-posinset={index + 1}
                    aria-setsize={sizes.length}
                    style:padding={`${sizes[index]}px 0.7em`}
                >
                    row {index}:&nbsp;{sizes[index]}px
                </div>
            {/each}
        </div>
    </div>
    <Footer
        attachment={virtualStickyFooter(model)}
        minRowsToAdd={1 - sizes.length}
        maxRowsToAdd={MAX_ROW_COUNT - sizes.length}
        onChangeRows={changeRows}
    />
</div>
