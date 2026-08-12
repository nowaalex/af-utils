import type { ListItemProps } from "@af-utils/virtual-react";
import {
    List,
    useVirtualItemRef,
    useVirtualModel
} from "@af-utils/virtual-react";
import { memo, useRef, useState } from "react";
import css from "./style.module.css";

/** Number of records rendered before the first prepend operation. */
const INITIAL_ITEM_COUNT = 10_000;

/** Number of records returned by each simulated prepend request. */
const PREPEND_BATCH_SIZE = 100;

/** Deterministic delay used to demonstrate an asynchronous prepend. */
const SIMULATED_FETCH_DELAY_MS = 500;

/** Minimum vertical padding assigned to a generated row. */
const MIN_ITEM_PADDING_PX = 20;

/** Number of integer padding values in the inclusive 20–80px range. */
const ITEM_PADDING_VARIANTS = 61;

/** Coprime step that distributes sequential ids across all padding values. */
const ITEM_PADDING_STEP = 37;

/** Mean border-box row size: two padding edges, text line and top border. */
const ESTIMATED_ITEM_SIZE_PX = 120;

type ItemRecord = ReturnType<typeof createItem>;
type ItemData = ItemRecord[];
type ItemStore = {
    items: ItemData;
    nextPrependedId: number;
};

const Item = memo<ListItemProps<ItemData>>(({ model, index, data }) => {
    const items = data as ItemData;

    return (
        <div
            ref={useVirtualItemRef(model, index)}
            className={css.item}
            role="listitem"
            aria-posinset={index + 1}
            aria-setsize={model.itemCount}
            style={{ padding: `${items[index].height}px 0.5em` }}
        >
            Idx:&nbsp;{index};&emsp;{items[index].name}
        </div>
    );
});

const getKey = (i: number, itemData: ItemData) => itemData[i].hash;

const createItem = (id: number) => ({
    name: id < 0 ? `Prepended person ${-id}` : `Person ${id}`,
    hash: id,
    height:
        MIN_ITEM_PADDING_PX +
        ((Math.abs(id) * ITEM_PADDING_STEP) % ITEM_PADDING_VARIANTS)
});

const createInitialStore = (): ItemStore => ({
    items: Array.from({ length: INITIAL_ITEM_COUNT }, (_, id) =>
        createItem(id)
    ),
    nextPrependedId: -1
});

/** Simulate an asynchronous request without making SSR output nondeterministic. */
const waitForPrependRequest = () =>
    new Promise<void>(resolve => {
        setTimeout(resolve, SIMULATED_FETCH_DELAY_MS);
    });

/* Creating extra component avoid rerendering everything when isLoading state changes */
const PrependButton = ({
    model,
    store
}: {
    model: ReturnType<typeof useVirtualModel>;
    store: ItemStore;
}) => {
    const [isLoading, setLoading] = useState(false);

    const prependItems = async () => {
        setLoading(true);
        await waitForPrependRequest();
        const newItems = Array.from({ length: PREPEND_BATCH_SIZE }, () =>
            createItem(store.nextPrependedId--)
        );
        const desiredScrollPos = newItems.length + model.visibleFrom;
        store.items.unshift(...newItems);
        model.spliceItems(0, 0, newItems.length);
        model.scrollToIndex(desiredScrollPos);
        setLoading(false);
    };

    return (
        <button
            type="button"
            className={css.prependButton}
            onClick={prependItems}
            disabled={isLoading}
        >
            Prepend {PREPEND_BATCH_SIZE} items
            {isLoading ? " (loading...)" : null}
        </button>
    );
};

const PrependItems = () => {
    const storeRef = useRef<ItemStore | null>(null);
    storeRef.current ??= createInitialStore();
    const store = storeRef.current;

    const model = useVirtualModel({
        estimatedItemSize: ESTIMATED_ITEM_SIZE_PX,
        itemCount: store.items.length
    });

    return (
        <List
            model={model}
            itemData={store.items}
            getKey={getKey}
            role="list"
            aria-label="Prepend items list"
            header={
                <div
                    className={css.listHeader}
                    ref={el => model.setStickyHeader(el)}
                >
                    <PrependButton model={model} store={store} />
                </div>
            }
        >
            {Item}
        </List>
    );
};

export default PrependItems;
