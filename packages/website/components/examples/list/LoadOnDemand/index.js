import { useState, useRef, memo } from "react";

import {
    useVirtual,
    useSubscription,
    areItemPropsEqual,
    EVT_TO,
    List
} from "@af-utils/react-virtual-list";

import faker from "faker";

const fetchRandomDescriptions = () =>
    new Promise(resolve =>
        setTimeout(
            resolve,
            200,
            Array.from({ length: 5 }, () => faker.lorem.paragraphs())
        )
    );

const Item = memo(
    ({ i, data: posts }) => (
        <div className="p-4">
            <div className="border-4 text-center ring-inset leading-[30vh]">
                maybe picture
            </div>
            <p>{posts[i]}</p>
        </div>
    ),
    areItemPropsEqual
);

const EVENTS = [EVT_TO];

const getKey = (i, itemData) => itemData[i];

const getEstimatedItemSize = (oldItemSizes, oldScrollSize) =>
    oldItemSizes.length ? Math.round(oldScrollSize / oldItemSizes.length) : 500;

const Posts = () => {
    const [posts, setPosts] = useState(() => [faker.lorem.paragraphs()]);

    const isLoadingRef = useRef(false);

    const model = useVirtual({
        itemCount: posts.length,
        getEstimatedItemSize
    });

    useSubscription(
        model,
        async () => {
            const { itemCount, to } = model;
            if (isLoadingRef.current === false && itemCount === to) {
                isLoadingRef.current = true;
                const paragraphs = await fetchRandomDescriptions();
                isLoadingRef.current = false;
                setPosts(p => p.concat(paragraphs));
            }
        },
        EVENTS,
        true
    );

    return (
        <List model={model} itemData={posts} getKey={getKey}>
            {Item}
        </List>
    );
};

export default Posts;
