import { VirtualScrollerEvent } from "@af-utils/virtual-core";
import type { ListItemProps } from "@af-utils/virtual-react";
import {
    List,
    useVirtual,
    useVirtualEffect,
    useVirtualItemRef
} from "@af-utils/virtual-react";
import { memo, useCallback, useRef, useState } from "react";
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

const Item = memo<ListItemProps<string[]>>(({ model, index, data }) => {
    const posts = data as string[];

    return (
        <div
            ref={useVirtualItemRef(model, index)}
            className={css.item}
            role="listitem"
            aria-posinset={index + 1}
            aria-setsize={model.itemCount}
        >
            <div className={css.itemHeader}>some picture</div>
            <p>{posts[index]}</p>
        </div>
    );
});

const Posts = () => {
    const [posts, setPosts] = useState(() => createDescriptions(0));

    const isLoadingRef = useRef(false);

    const model = useVirtual({
        itemCount: posts.length,
        estimatedItemSize: 500
    });

    useVirtualEffect(
        model,
        useCallback(async () => {
            if (isLoadingRef.current === false && posts.length === model.to) {
                isLoadingRef.current = true;
                const paragraphs = await fetchDescriptions(posts.length);
                isLoadingRef.current = false;
                setPosts(p => [...p, ...paragraphs]);
            }
        }, [model, posts]),
        VirtualScrollerEvent.RANGE
    );

    return (
        <List
            model={model}
            itemData={posts}
            role="list"
            aria-label="Load on demand list"
        >
            {Item}
        </List>
    );
};

export default Posts;
