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
    import { onMount } from "svelte";
    import css from "./style.module.css";

    const model = createVirtual({
        itemCount: 50_000,
        estimatedItemSize: 50
    });
    const range = createVirtualRange(model);
    // oxlint-disable-next-line eslint/no-unassigned-vars -- Svelte bind:this assigns this reference during DOM creation.
    let before: HTMLDivElement;
    // oxlint-disable-next-line eslint/no-unassigned-vars -- Svelte bind:this assigns this reference during DOM creation.
    let after: HTMLDivElement;

    const updateSpacers = () => {
        if (!before || !after) return;
        const beforeSize = model.renderedRangeOffset;
        before.style.height = `${beforeSize}px`;
        after.style.height = `${Math.max(
            0,
            model.scrollSize - beforeSize - model.renderedRangeSize
        )}px`;
    };

    onMount(() => {
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

<div class={css.wrapper} use:virtualScroller={model}>
    <table class={css.table}>
        <thead class={css.thead} use:virtualStickyHeader={model}>
            <tr>
                <th scope="col">Column one</th>
                <th scope="col">Column two</th>
            </tr>
        </thead>
        <tbody use:virtualContainer={model}>
            <tr aria-hidden="true">
                <td class={css.spacerCell} colspan={2}>
                    <div
                        class={css.spacer}
                        bind:this={before}
                        style:height={`${model.renderedRangeOffset}px`}
                    ></div>
                </td>
            </tr>
            {#each $range as index (index)}
                <tr use:virtualItem={{ model, index }}>
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
        <tfoot class={css.tfoot} use:virtualStickyFooter={model}>
            <tr>
                <td>Row one</td>
                <td>Row two</td>
            </tr>
        </tfoot>
    </table>
</div>
