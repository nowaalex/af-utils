<svelte:options runes={true} />

<script lang="ts">
    import { VirtualScrollerEvent } from "@af-utils/virtual-core";
    import { createVirtualList, virtualItem } from "@af-utils/virtual-svelte";
    import { untrack } from "svelte";
    import css from "./style.module.css";

    const descriptionParts = [
        "Virtualized content stays responsive as the collection grows.",
        "Only the visible range is mounted and measured.",
        "This deterministic text keeps framework screenshots comparable."
    ];

    const createDescriptions = (start: number) => {
        const descriptions: string[] = [];

        for (let offset = 0; offset < 5; offset++) {
            const parts: string[] = [];
            const partCount = 1 + ((start + offset) % descriptionParts.length);

            for (let part = 0; part < partCount; part++) {
                parts.push(
                    descriptionParts[
                        (start + offset + part) % descriptionParts.length
                    ]
                );
            }
            descriptions.push(parts.join(" "));
        }

        return descriptions;
    };

    const fetchDescriptions = (start: number) =>
        new Promise<string[]>((resolve) => {
            setTimeout(resolve, 200, createDescriptions(start));
        });

    const initialPosts = createDescriptions(0);
    let posts = $state(initialPosts);
    let loading = $state(false);
    const { model, range, scroller, size, items } = createVirtualList({
        itemCount: initialPosts.length,
        estimatedItemSize: 500
    });

    const loadMore = async () => {
        if (loading || posts.length !== model.to) return;
        loading = true;
        const paragraphs = await fetchDescriptions(posts.length);
        posts = [...posts, ...paragraphs];
        model.setItemCount(posts.length);
        loading = false;
    };

    $effect(() => {
        const unsubscribe = model.subscribe(
            () => void loadMore(),
            VirtualScrollerEvent.RANGE
        );
        untrack(() => void loadMore());
        return unsubscribe;
    });
</script>

<div {@attach scroller} role="list" aria-label="Load on demand list">
    <div {@attach size}>
        <div {@attach items}>
            {#each range() as index (index)}
                <div
                    {@attach virtualItem(model, () => index)}
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
