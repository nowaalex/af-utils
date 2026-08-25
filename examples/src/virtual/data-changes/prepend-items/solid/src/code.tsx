import {
    createVirtual,
    createVirtualItemRef,
    VirtualList,
    type ListItemProps
} from "@af-utils/virtual-solid";
import { createSignal } from "solid-js";
import css from "./style.module.css";

const INITIAL_ITEM_COUNT = 10_000;
const PREPEND_BATCH_SIZE = 100;
const SIMULATED_FETCH_DELAY_MS = 500;
const MIN_ITEM_PADDING_PX = 20;
const ITEM_PADDING_VARIANTS = 61;
const ITEM_PADDING_STEP = 37;
const ESTIMATED_ITEM_SIZE_PX = 120;

const createItem = (id: number) => ({
    name: id < 0 ? `Prepended person ${-id}` : `Person ${id}`,
    id,
    height:
        MIN_ITEM_PADDING_PX +
        ((Math.abs(id) * ITEM_PADDING_STEP) % ITEM_PADDING_VARIANTS)
});

type ItemData = ReturnType<typeof createItem>[];

const Item = (props: ListItemProps<ItemData>) => (
    <div
        ref={createVirtualItemRef(props.model, props.index)}
        class={css.item}
        role="listitem"
        aria-posinset={props.index() + 1}
        aria-setsize={props.model.itemCount}
        style={{ padding: `${props.data?.[props.index()]?.height}px 0.5em` }}
    >
        Idx:&nbsp;{props.index()};&emsp;{props.data?.[props.index()]?.name}
    </div>
);

const waitForPrependRequest = () =>
    new Promise<void>(resolve => {
        setTimeout(resolve, SIMULATED_FETCH_DELAY_MS);
    });

const PrependItems = () => {
    const [items, setItems] = createSignal(
        Array.from({ length: INITIAL_ITEM_COUNT }, (_, id) => createItem(id))
    );
    const [loading, setLoading] = createSignal(false);
    const model = createVirtual(() => ({
        estimatedItemSize: ESTIMATED_ITEM_SIZE_PX,
        itemCount: items().length
    }));
    let nextPrependedId = -1;

    const prependItems = async () => {
        setLoading(true);
        await waitForPrependRequest();
        const newItems = Array.from({ length: PREPEND_BATCH_SIZE }, () =>
            createItem(nextPrependedId--)
        );
        const desiredScrollPosition = newItems.length + model.visibleFrom;
        setItems(current => [...newItems, ...current]);
        model.spliceItems(0, 0, newItems.length);
        model.scrollToIndex(desiredScrollPosition);
        setLoading(false);
    };

    return (
        <VirtualList
            model={model}
            itemData={items()}
            getItemKey={index => items()[index]?.id ?? index}
            role="list"
            aria-label="Prepend items list"
            header={
                <div
                    class={css.listHeader}
                    ref={element => model.setStickyHeader(element)}
                >
                    <button
                        type="button"
                        class={css.prependButton}
                        onClick={() => void prependItems()}
                        disabled={loading()}
                    >
                        Prepend {PREPEND_BATCH_SIZE} items
                        {loading() ? " (loading...)" : null}
                    </button>
                </div>
            }
        >
            {Item}
        </VirtualList>
    );
};

export default PrependItems;
