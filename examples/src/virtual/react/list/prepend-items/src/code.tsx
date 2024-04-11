import { memo, useRef, useState } from "react";
import { useVirtualModel, List } from "@af-utils/virtual-react";
import { randNumber, randFullName } from "@ngneat/falso";
import { BiLoaderCircle } from "react-icons/bi";
import type { ListItemProps } from "@af-utils/virtual-react";
import css from "./style.module.css";

const Item = memo<ListItemProps>(({ i, model, data }) => (
    <div
        ref={el => model.el(i, el)}
        className={css.item}
        style={{ padding: `${data[i].height}px 0.5em` }}
    >
        Idx:&nbsp;{i};&emsp;{data[i].name}
    </div>
));

const getKey = (i: number, itemData: ReturnType<typeof getRandomItem>[]) =>
    itemData[i].hash;

let hashCounter = 0;

const getRandomItem = () => ({
    name: randFullName(),
    hash: hashCounter++,
    height: randNumber({ min: 20, max: 80 })
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
    model: ReturnType<typeof useVirtualModel>;
    items: ReturnType<typeof getRandomItem>[];
}) => {
    const [isLoading, setLoading] = useState(false);

    const prependItems = async () => {
        setLoading(true);
        const newItems = await fetch100RandomItemsAsync();
        const desiredScrollPos = newItems.length + model.visibleFrom;
        model.setItemCount(items.unshift(...newItems));
        model.scrollToIndex(desiredScrollPos);
        setLoading(false);
    };

    return (
        <button
            type="button"
            className={css.prependButton}
            onClick={prependItems}
        >
            Prepend 100 items
            {isLoading ? <BiLoaderCircle size="1.5em" /> : null}
        </button>
    );
};

const PrependItems = () => {
    const items = (useRef<ReturnType<typeof getRandomItem>[]>().current ||=
        Array.from({ length: 10000 }, getRandomItem));

    const model = useVirtualModel({
        estimatedItemSize: 85,
        itemCount: items.length
    });

    return (
        <List
            model={model}
            itemData={items}
            getKey={getKey}
            header={
                <div
                    className={css.listHeader}
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
