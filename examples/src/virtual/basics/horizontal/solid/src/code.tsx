import {
    createVirtual,
    createVirtualItemRef,
    VirtualList,
    type ListItemProps
} from "@af-utils/virtual-solid";
import css from "./style.module.css";

const Item = (props: ListItemProps) => (
    <div
        ref={createVirtualItemRef(props.model, props.index)}
        class={props.index() % 2 ? css.oddItem : css.evenItem}
        role="listitem"
        aria-posinset={props.index() + 1}
        aria-setsize={props.model.itemCount}
    >
        col&nbsp;{props.index()}
    </div>
);

const HorizontalList = () => {
    const columns = createVirtual({
        itemCount: 50_000,
        estimatedItemSize: 75,
        horizontal: true
    });
    return (
        <VirtualList
            model={columns}
            role="list"
            aria-label="Horizontal virtual list"
        >
            {Item}
        </VirtualList>
    );
};

export default HorizontalList;
