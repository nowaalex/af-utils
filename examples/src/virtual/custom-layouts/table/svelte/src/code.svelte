<svelte:options runes={true} />

<script lang="ts">
    import { VirtualScrollerEvent } from "@af-utils/virtual-core";
    import {
        createVirtual,
        createVirtualRange,
        virtualContainer,
        virtualItem,
        virtualScroller,
        virtualStickyFooter,
        virtualStickyHeader
    } from "@af-utils/virtual-svelte";
    import css from "./style.module.css";

    const model = createVirtual({
        itemCount: 50_000,
        estimatedItemSize: 50
    });
    const range = createVirtualRange(model);
    let before = $state<HTMLDivElement>();
    let after = $state<HTMLDivElement>();

    const updateSpacers = () => {
        if (!before || !after) return;
        const beforeSize = model.renderedRangeOffset;
        before.style.height = `${beforeSize}px`;
        after.style.height = `${Math.max(
            0,
            model.scrollSize - beforeSize - model.renderedRangeSize
        )}px`;
    };

    $effect(() => {
        const unsubscribe = model.subscribe(
            updateSpacers,
            VirtualScrollerEvent.RANGE |
                VirtualScrollerEvent.SCROLL_SIZE |
                VirtualScrollerEvent.SIZES
        );
        updateSpacers();
        return unsubscribe;
    });
</script>

<div class={css.wrapper} {@attach virtualScroller(model)}>
    <table class={css.table}>
        <thead class={css.thead} {@attach virtualStickyHeader(model)}>
            <tr>
                <th scope="col">Column one</th>
                <th scope="col">Column two</th>
            </tr>
        </thead>
        <tbody {@attach virtualContainer(model)}>
            <tr aria-hidden="true">
                <td class={css.spacerCell} colspan={2}>
                    <div
                        class={css.spacer}
                        bind:this={before}
                        style:height={`${model.renderedRangeOffset}px`}
                    ></div>
                </td>
            </tr>
            {#each range() as index (index)}
                <tr {@attach virtualItem(model, () => index)}>
                    <td>Cell one - {index}</td>
                    <td>
                        Cell two - {index}
                        {#if index % 3 === 1}
                            <span>Additional content</span>
                        {:else if index % 3 === 2}
                            <span>Additional content</span>
                            <span>One more line</span>
                        {/if}
                    </td>
                </tr>
            {/each}
            <tr aria-hidden="true">
                <td class={css.spacerCell} colspan={2}>
                    <div
                        class={css.spacer}
                        bind:this={after}
                        style:height={`${Math.max(
                            0,
                            model.scrollSize -
                                model.renderedRangeOffset -
                                model.renderedRangeSize
                        )}px`}
                    ></div>
                </td>
            </tr>
        </tbody>
        <tfoot class={css.tfoot} {@attach virtualStickyFooter(model)}>
            <tr>
                <td>Row one</td>
                <td>Row two</td>
            </tr>
        </tfoot>
    </table>
</div>
