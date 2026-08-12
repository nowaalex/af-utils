import { VirtualScrollerEvent } from "@af-utils/virtual-core";
import {
    createVirtual,
    createVirtualItemRef,
    List,
    type ListItemProps
} from "@af-utils/virtual-solid";
import { createSignal, onCleanup, onMount } from "solid-js";
import css from "./style.module.css";

const descriptionParts = [
    "Virtualized content stays responsive as the collection grows.",
    "Only the visible range is mounted and measured.",
    "This deterministic text keeps framework screenshots comparable."
];

const createDescriptions = (start: number) =>
    Array.from({ length: 5 }, (_description, offset) =>
        Array.from(
            { length: 1 + ((start + offset) % descriptionParts.length) },
            (_part, part) =>
                descriptionParts[
                    (start + offset + part) % descriptionParts.length
                ]
        ).join(" ")
    );

const fetchDescriptions = (start: number) =>
    new Promise<string[]>(resolve => {
        setTimeout(resolve, 200, createDescriptions(start));
    });

const Item = (props: ListItemProps<string[]>) => (
    <div
        ref={createVirtualItemRef(props.model, props.index)}
        class={css.item}
        role="listitem"
        aria-posinset={props.index + 1}
        aria-setsize={props.model.itemCount}
    >
        <div class={css.itemHeader}>some picture</div>
        <p>{props.data?.[props.index]}</p>
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
        <List
            model={model}
            itemData={posts()}
            role="list"
            aria-label="Load on demand list"
        >
            {Item}
        </List>
    );
};

export default Posts;
