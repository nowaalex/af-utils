import { memo, useState, useRef, useEffect } from "react";
import { useVirtual, List } from "@af-utils/react-virtual-list";
import times from "lodash/times";
import { faker } from "@faker-js/faker";
import useFakerSeed from "/hooks/useFakerSeed";

const Item = memo(({ i, model, data }) => (
    <div
        ref={el => model.el(i, el)}
        className="border-t p-2 border-zinc-400"
        style={{ lineHeight: data[i].height + "px" }}
    >
        Idx:&nbsp;{i};&emsp;{data[i].name}
    </div>
));

const getKey = (i, itemData) => itemData[i].name;

const getRandomItem = () => ({
    name: faker.name.firstName() + " " + faker.name.lastName(),
    height: faker.mersenne.rand(140, 30)
});

/* new Promise is made to simulate asynchronous fetch request */
const fetch100RandomItemsAsync = () =>
    new Promise(resolve =>
        setTimeout(resolve, 1000, times(100, getRandomItem))
    );

/*
    Approach from other examples may be used here also, just for diversity
*/
const getEstimatedItemSize = oldItemSizes =>
    oldItemSizes.length
        ? Math.round((oldItemSizes[0] + oldItemSizes.at(-1)) / 2)
        : 60;

const PrependItems = () => {
    // fake data should be consistent for ssr purpose
    useFakerSeed(1234);

    const scrollPosRef = useRef(null);

    const [items, setItems] = useState(() => times(1000, getRandomItem));

    const model = useVirtual({
        getEstimatedItemSize,
        itemCount: items.length
    });

    const prependItems = async () => {
        const newItems = await fetch100RandomItemsAsync();

        /*
            model.getIndex(model.from) may give wrong resuts
            due to overscan optimization.
            Must use scrollPos here.
        */
        const firstVisibleIndex = model.getIndex(model.scrollPos);

        /*
            By default model.scrollTo rewinds exactly to element's top.
            If only half of element is visible - we must remember pixel offset.
        */
        const pxOffset = model.scrollPos - model.getOffset(firstVisibleIndex);

        const indexToScroll = firstVisibleIndex + newItems.length;

        scrollPosRef.current = [indexToScroll, pxOffset];

        setItems(currentItems => [...newItems, ...currentItems]);
    };

    useEffect(() => {
        if (scrollPosRef.current) {
            const [indexToScroll, pxOffset] = scrollPosRef.current;
            model.scrollTo(indexToScroll, pxOffset);
            scrollPosRef.current = null;
        }
        /*
            useEffect dependency may be changed, if you have both
            prepending/appending or you need to sync scroll pos only
            in certain cases.
        */
    }, [model, items]);

    return (
        <div className="flex flex-col gap-4 h-full">
            <button
                type="button"
                className="px-6 py-2 ring-4"
                onClick={prependItems}
            >
                Prepend 100 items
            </button>
            <List
                className="grow basis-96"
                model={model}
                itemData={items}
                getKey={getKey}
            >
                {Item}
            </List>
        </div>
    );
};

export default PrependItems;
