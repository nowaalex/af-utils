import { VirtualScrollerEvent } from "@af-utils/virtual-core";
import type { ListItemProps } from "@af-utils/virtual-preact";
import {
    List,
    useVirtual,
    useVirtualEffect,
    useVirtualItemRef
} from "@af-utils/virtual-preact";
import { memo, useCallback, useRef, useState } from "preact/compat";
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
