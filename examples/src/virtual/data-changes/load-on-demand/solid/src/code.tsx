import { VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    createVirtual,
    createVirtualItemRef,
    VirtualList,
    type ListItemProps
} from "@af-utils/virtual-solid";
import { createSignal, onCleanup, onMount } from "solid-js";
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
    new Promise<string[]>(resolve => {
        setTimeout(resolve, 200, createDescriptions(start));
    });

const Item = (props: ListItemProps<string[]>) => (
    <div
        ref={createVirtualItemRef(props.model, props.index)}
        class={css.item}
        role="listitem"
        aria-posinset={props.index() + 1}
        aria-setsize={props.model.itemCount}
    >
        <div class={css.itemHeader}>some picture</div>
        <p>{props.data?.[props.index()]}</p>
    </div>
);

const Posts = () => {
    const [posts, setPosts] = createSignal(createDescriptions(0));
    const model = createVirtual(() => ({
        itemCount: posts().length,
        estimatedItemSize: 500
    }));
    let loading = false;

    onMount(() => {
        const loadMore = async () => {
            if (loading || posts().length !== model.to) return;
            loading = true;
            const paragraphs = await fetchDescriptions(posts().length);
            loading = false;
            setPosts(current => [...current, ...paragraphs]);
        };
        const unsubscribe = model.subscribe(
            () => void loadMore(),
            VirtualScrollerEvent.RANGE
        );
        void loadMore();
        onCleanup(unsubscribe);
    });

    return (
        <VirtualList
            model={model}
            itemData={posts()}
            role="list"
            aria-label="Load on demand list"
        >
            {Item}
        </VirtualList>
    );
};

export default Posts;
