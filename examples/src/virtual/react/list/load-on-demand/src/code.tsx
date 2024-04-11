import { useState, useRef, useCallback, memo } from "react";
import { useVirtual, useSubscription, List } from "@af-utils/virtual-react";
import { VirtualScrollerEvent } from "@af-utils/virtual-core";
import { randNumber, randParagraph } from "@ngneat/falso";
import type { ListItemProps } from "@af-utils/virtual-react";
import css from "./style.module.css";

const fetchRandomDescriptions = () =>
    new Promise<string[]>(resolve =>
        setTimeout(
            resolve,
            200,
            Array.from({ length: 5 }, () =>
                randParagraph({ length: randNumber({ min: 1, max: 3 }) })
            )
        )
    );

const Item = memo<ListItemProps>(({ i, model, data: posts }) => (
    <div ref={el => model.el(i, el)} className={css.item}>
        <div className={css.itemHeader}>some picture</div>
        <p>{posts[i]}</p>
    </div>
));

const EVENTS = [VirtualScrollerEvent.RANGE] as const;

const Posts = () => {
    const [posts, setPosts] = useState(() =>
        randParagraph({ length: randNumber({ min: 1, max: 3 }) })
    );

    const isLoadingRef = useRef(false);

    const model = useVirtual({
        itemCount: posts.length,
        estimatedItemSize: 500
    });

    useSubscription(
        model,
        EVENTS,
        useCallback(async () => {
            if (isLoadingRef.current === false && posts.length === model.to) {
                isLoadingRef.current = true;
                const paragraphs = await fetchRandomDescriptions();
                isLoadingRef.current = false;
                setPosts(p => [...p, ...paragraphs]);
            }
        }, [model, posts])
    );

    return (
        <List model={model} itemData={posts}>
            {Item}
        </List>
    );
};

export default Posts;
