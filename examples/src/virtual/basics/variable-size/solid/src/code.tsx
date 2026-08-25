import {
    createVirtual,
    createVirtualItemRef,
    VirtualList,
    type ListItemProps
} from "@af-utils/virtual-solid";
import { createSignal } from "solid-js";
import css from "./style.module.css";

const DEFAULT_ROW_COUNT = 50_000;
const sizes = Array.from(
    { length: DEFAULT_ROW_COUNT },
    (_, index) => 20 + ((index ** 2) & 31)
);

interface ItemData {
    expanded(): boolean;
    toggle(): void;
}

const Item = (props: ListItemProps<ItemData>) => {
    const padding = () =>
        sizes[props.index()] +
        (props.index() === 0 && props.data?.expanded() ? 40 : 0);

    return (
        <div
            ref={createVirtualItemRef(props.model, props.index)}
            class={css.item}
            role="listitem"
            aria-posinset={props.index() + 1}
            aria-setsize={sizes.length}
            style={{
                padding: `${padding()}px 0`,
                background: `hsl(${(props.index() * 11) % 360},60%,60%)`
            }}
        >
            row {props.index()}:&nbsp;{sizes[props.index()]}px
            {props.index() === 0 && (
                <button
                    class={css.toggle}
                    type="button"
                    aria-expanded={props.data?.expanded()}
                    onClick={props.data?.toggle}
                >
                    Toggle first row
                </button>
            )}
        </div>
    );
};

const VariableSizeList = () => {
    const [expanded, setExpanded] = createSignal(false);
    const model = createVirtual({
        itemCount: DEFAULT_ROW_COUNT,
        estimatedItemSize: 75
    });
    return (
        <VirtualList
            class={css.list}
            model={model}
            itemData={{
                expanded,
                toggle: () => setExpanded(value => !value)
            }}
            role="list"
        >
            {Item}
        </VirtualList>
    );
};

export default VariableSizeList;
