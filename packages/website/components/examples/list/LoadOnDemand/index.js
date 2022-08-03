import { useState, useRef, useCallback, memo } from "react";

import {
    useVirtual,
    useSubscription,
    EVT_TO,
    List
} from "@af-utils/react-virtual-list";

import useFakerSeed from "/hooks/useFakerSeed";

import { faker } from "@faker-js/faker";

const fetchRandomDescriptions = () =>
    new Promise(resolve =>
        setTimeout(
            resolve,
            200,
            Array.from({ length: 5 }, () => faker.lorem.paragraphs())
        )
    );

const Item = memo(({ i, model, data: posts }) => (
    <div ref={el => model.el(i, el)} className="p-4">
        <div className="border-4 text-center ring-inset leading-[30vh]">
            maybe picture
        </div>
        <p>{posts[i]}</p>
    </div>
));

const EVENTS = [EVT_TO];

const getKey = (i, itemData) => itemData[i];

const getEstimatedItemSize = (oldItemSizes, oldScrollSize) =>
    oldItemSizes.length ? Math.round(oldScrollSize / oldItemSizes.length) : 500;

const Posts = () => {
    // fake data should be consistent for ssr purpose
    useFakerSeed(12345);

    const [posts, setPosts] = useState(() => [faker.lorem.paragraphs()]);

    const isLoadingRef = useRef(false);

    const model = useVirtual({
        itemCount: posts.length,
        getEstimatedItemSize
    });

    useSubscription(
        model,
        EVENTS,
        useCallback(async () => {
            if (
                isLoadingRef.current === false &&
                model.itemCount === model.to
            ) {
                isLoadingRef.current = true;
                const paragraphs = await fetchRandomDescriptions();
                isLoadingRef.current = false;
                setPosts(p => p.concat(paragraphs));
            }
        }, [model])
    );

    return (
        <List model={model} itemData={posts} getKey={getKey} className="h-full">
            {Item}
        </List>
    );
};

export default Posts;
