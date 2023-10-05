"use client";

import { memo, useRef, useState } from "react";
import {
    useVirtualModel,
    List,
    VirtualScroller
} from "@af-utils/react-virtual-list";
import { randNumber, randFullName } from "@ngneat/falso";
import { BiLoaderCircle } from "react-icons/bi";
import useFakerSeed from "hooks/useFakerSeed";

const Item = memo<{
    i: number;
    model: VirtualScroller;
    data: ReturnType<typeof getRandomItem>[];
}>(({ i, model, data }) => (
    <div
        ref={el => model.el(i, el)}
        className="border-t p-2 border-zinc-400"
        style={{ lineHeight: data[i].height + "px" }}
    >
        Idx:&nbsp;{i};&emsp;{data[i].name}
    </div>
));

const getKey = (i: number, itemData: ReturnType<typeof getRandomItem>[]) =>
    itemData[i].name;

const getRandomItem = () => ({
    name: randFullName(),
    height: randNumber({ min: 30, max: 140 })
});

/* new Promise is made to simulate asynchronous fetch request */
const fetch100RandomItemsAsync = () =>
    new Promise<ReturnType<typeof getRandomItem>[]>(resolve =>
        setTimeout(
            resolve,
            randNumber({ min: 100, max: 2000 }),
            Array.from({ length: 100 }, getRandomItem)
        )
    );

/* Creating extra component avoid rerendering everything when isLoading state changes */
const PrependButton = ({
    model,
    items
}: {
    model: VirtualScroller;
    items: ReturnType<typeof getRandomItem>[];
}) => {
    const [isLoading, setLoading] = useState(false);

    const prependItems = async () => {
        setLoading(true);
        const newItems = await fetch100RandomItemsAsync();
        const desiredScrollPos = newItems.length + model.visibleFrom;
        model.set({ itemCount: items.unshift(...newItems) });
        model.scrollToIndex(desiredScrollPos);
        setLoading(false);
    };

    return (
        <button
            type="button"
            className="px-2 py-1 border bg-orange-200 hover:bg-orange-300 border-gray-700 flex gap-2 items-center"
            onClick={prependItems}
        >
            Prepend 100 items
            {isLoading ? <BiLoaderCircle size="1.5em" /> : null}
        </button>
    );
};

const PrependItems = () => {
    // fake data should be consistent for ssr purpose
    useFakerSeed(1234);

    const items = (useRef<ReturnType<typeof getRandomItem>[]>().current ||=
        Array.from({ length: 1000 }, getRandomItem));

    const model = useVirtualModel({
        estimatedItemSize: 85,
        itemCount: items.length
    });

    return (
        <List
            className="h-full lg:min-w-[20em]"
            model={model}
            itemData={items}
            getKey={getKey}
            header={
                <div
                    className="flex justify-center bg-gray-200 p-3 sticky top-0"
                    ref={el => model.setStickyHeader(el)}
                >
                    <PrependButton model={model} items={items} />
                </div>
            }
        >
            {Item}
        </List>
    );
};

export default PrependItems;
