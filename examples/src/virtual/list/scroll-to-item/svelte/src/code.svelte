<script lang="ts">
    import {
        createVirtual,
        createVirtualList,
        virtualItem,
        virtualStickyFooter,
        virtualStickyHeader
    } from "@af-utils/virtual-svelte";
    import { onMount } from "svelte";
    import css from "./style.module.css";

    const DEFAULT_ROW_COUNT = 50_000;
    let sizes = Array.from(
        { length: DEFAULT_ROW_COUNT },
        (_, index) => 20 + ((index ** 2) & 31)
    );
    const model = createVirtual({
        itemCount: sizes.length,
        estimatedItemSize: 78
    });
    const { range, scroller, size, items } = createVirtualList(model);

    const scrollFromForm = (target: EventTarget | null) => {
        const form = target as HTMLFormElement;
        const index = Number.parseInt(
            String(new FormData(form).get("index") ?? ""),
            10
        );
        if (!Number.isNaN(index)) model.scrollToIndex(index, true);
    };

    const changeRows = (target: EventTarget | null) => {
        const form = target as HTMLFormElement;
        const rowsToAdd = Number.parseInt(
            String(new FormData(form).get("rowsToAdd") ?? ""),
            10
        );
        if (!Number.isNaN(rowsToAdd) && rowsToAdd !== 0) {
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

    const submitScroll = (event: SubmitEvent) => {
        event.preventDefault();
        scrollFromForm(event.currentTarget);
    };
    const submitRows = (event: SubmitEvent) => {
        event.preventDefault();
        changeRows(event.currentTarget);
    };

    onMount(() => model.scrollToIndex(sizes.length - 1));
</script>

<div use:scroller class={css.list} role="list">
    <form
        use:virtualStickyHeader={model}
        class={`${css.form} ${css.top0}`}
        onsubmit={submitScroll}
    >
        <label
            >Smooth scroll to index:&nbsp;<input
                required
                value={Math.round(sizes.length / 2)}
                name="index"
                class={css.inp}
                type="number"
            /></label
        >
        <button class={css.btn} type="submit">Go</button>
    </form>
    <div use:size>
        <div use:items>
            {#each $range as index (index)}
                <div
                    use:virtualItem={{ model, index }}
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
    <form
        use:virtualStickyFooter={model}
        class={`${css.form} ${css.bottom0}`}
        onsubmit={submitRows}
    >
        <label
            >Rows to add:&nbsp;<input
                value={0}
                type="number"
                required
                name="rowsToAdd"
                class={css.inp}
            /></label
        >
        <button class={css.btn} type="submit">Add and scroll to end</button>
    </form>
</div>
