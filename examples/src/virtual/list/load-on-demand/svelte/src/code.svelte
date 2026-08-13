<script lang="ts">
    import { VirtualScrollerEvent } from "@af-utils/virtual-core";
    import {
        createVirtual,
        createVirtualList,
        virtualItem
    } from "@af-utils/virtual-svelte";
    import { onMount } from "svelte";
    import css from "./style.module.css";

    const descriptionParts = [
        "Virtualized content stays responsive as the collection grows.",
        "Only the visible range is mounted and measured.",
        "This deterministic text keeps framework screenshots comparable."
    ];

    const createDescriptions = (start: number) =>
        Array.from({ length: 5 }, (_description, offset) =>
            Array.from(
                {
                    length: 1 + ((start + offset) % descriptionParts.length)
                },
                (_part, part) =>
                    descriptionParts[
                        (start + offset + part) % descriptionParts.length
                    ]
            ).join(" ")
        );

    const fetchDescriptions = (start: number) =>
        new Promise<string[]>((resolve) => {
            setTimeout(resolve, 200, createDescriptions(start));
        });

    let posts = createDescriptions(0);
    let loading = false;
    const model = createVirtual({
        itemCount: posts.length,
        estimatedItemSize: 500
    });
    const { range, scroller, size, items } = createVirtualList(model);

    const loadMore = async () => {
        if (loading || posts.length !== model.to) return;
        loading = true;
        const paragraphs = await fetchDescriptions(posts.length);
        posts = [...posts, ...paragraphs];
        model.setItemCount(posts.length);
        loading = false;
    };

    onMount(() => {
        const unsubscribe = model.subscribe(
            () => void loadMore(),
            VirtualScrollerEvent.RANGE
        );
        void loadMore();
        return unsubscribe;
    });
</script>

<div use:scroller role="list" aria-label="Load on demand list">
    <div use:size>
        <div use:items>
            {#each $range as index (index)}
                <div
                    use:virtualItem={{ model, index }}
                    class={css.item}
                    role="listitem"
                    aria-posinset={index + 1}
                    aria-setsize={model.itemCount}
                >
                    <div class={css.itemHeader}>some picture</div>
                    <p>{posts[index]}</p>
                </div>
            {/each}
        </div>
    </div>
</div>
