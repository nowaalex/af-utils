import { memo, useState, useRef, useLayoutEffect } from "react";
import { useVirtual, List } from "@af-utils/react-virtual-list";
import { randNumber, randFullName } from "@ngneat/falso";
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
    name: randFullName(),
    height: randNumber({ min: 30, max: 140 })
});

/* new Promise is made to simulate asynchronous fetch request */
const fetch100RandomItemsAsync = () =>
    new Promise(resolve =>
        setTimeout(resolve, 1000, Array.from({ length: 100 }, getRandomItem))
    );

const PrependItems = () => {
    // fake data should be consistent for ssr purpose
    useFakerSeed(1234);

    const scrollPosRef = useRef(null);

    const [items, setItems] = useState(() =>
        Array.from({ length: 1000 }, getRandomItem)
    );

    const model = useVirtual({
        estimatedItemSize: 60,
        itemCount: items.length
    });

    const prependItems = async () => {
        const newItems = await fetch100RandomItemsAsync();
        scrollPosRef.current = newItems.length + model.visibleFrom;
        setItems(currentItems => [...newItems, ...currentItems]);
    };

    useLayoutEffect(() => {
        if (scrollPosRef.current) {
            model.scrollTo(scrollPosRef.current);
            scrollPosRef.current = null;
        }
        /*
            useEffect dependency may be changed, if you have both
            prepending/appending or you need to sync scroll pos only
            in certain cases.
        */
    }, [model, items]);

    return (
        <div className="flex flex-col gap-4 h-full lg:min-w-[20em]">
            <button
                type="button"
                className="px-6 py-2 bg-orange-300"
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
