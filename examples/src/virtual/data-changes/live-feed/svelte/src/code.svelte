<svelte:options runes={true} />

<script lang="ts">
    import { createVirtualList, virtualItem } from "@af-utils/virtual-svelte";
    import { tick } from "svelte";
    import css from "./style.module.css";

    interface Message {
        id: number;
        padding: number;
        text: string;
    }

    const INITIAL_COUNT = 200;
    const createMessage = (id: number): Message => ({
        id,
        padding: 8 + ((id * 13) % 18),
        text: `Message ${id}`
    });

    let messages = $state(
        Array.from({ length: INITIAL_COUNT }, (_, id) => createMessage(id))
    );
    let shouldFollowEnd = true;
    const { model, range, scroller, size, items } = createVirtualList(() => ({
        estimatedItemSize: 52,
        itemCount: messages.length
    }));

    const scrollToEnd = () => model.scrollToIndex(messages.length - 1);
    const appendMessage = () => {
        shouldFollowEnd = model.to === model.itemCount;
        messages.push(createMessage(messages.length));
    };
    const followAfterUpdate = async () => {
        await tick();
        if (shouldFollowEnd) scrollToEnd();
    };

    $effect(() => {
        if (messages.length > 0) void followAfterUpdate();
    });
</script>

<div class={css.example}>
    <div class={css.toolbar}>
        <button type="button" onclick={appendMessage}>Append message</button>
        <button type="button" onclick={scrollToEnd}>Jump to latest</button>
        <output class={css.status}>{messages.length} messages</output>
    </div>
    <div
        class={css.list}
        {@attach scroller}
        role="list"
        aria-label="Live message feed"
    >
        <div {@attach size}>
            <div {@attach items}>
                {#each range() as index (messages[index]?.id ?? index)}
                    <div
                        {@attach virtualItem(model, () => index)}
                        class={css.item}
                        role="listitem"
                        aria-posinset={index + 1}
                        aria-setsize={messages.length}
                        style:padding-block="{messages[index].padding}px"
                    >
                        {messages[index].text}
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
