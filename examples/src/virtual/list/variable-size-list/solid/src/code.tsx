import {
    createVirtual,
    createVirtualItemRef,
    List,
    type ListItemProps
} from "@af-utils/virtual-solid";
import css from "./style.module.css";

const DEFAULT_ROW_COUNT = 50_000;
const sizes = Array.from(
    { length: DEFAULT_ROW_COUNT },
    (_, index) => 20 + ((index ** 2) & 31)
);

const Item = (props: ListItemProps<number[]>) => (
    <div
        ref={createVirtualItemRef(props.model, props.index)}
        class={css.item}
        role="listitem"
        aria-posinset={props.index + 1}
        aria-setsize={props.data?.length}
        style={{
            padding: `${props.data?.[props.index]}px 0`,
            background: `hsl(${(props.index * 11) % 360},60%,60%)`
        }}
    >
        row {props.index}:&nbsp;{props.data?.[props.index]}px
    </div>
);

const VariableSizeList = () => {
    const model = createVirtual({
        itemCount: DEFAULT_ROW_COUNT,
        estimatedItemSize: 75
    });
    return (
        <List class={css.list} model={model} itemData={sizes} role="list">
            {Item}
        </List>
    );
};

export default VariableSizeList;
