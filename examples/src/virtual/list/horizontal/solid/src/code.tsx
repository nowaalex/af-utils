import {
    createVirtual,
    createVirtualItemRef,
    List,
    type ListItemProps
} from "@af-utils/virtual-solid";
import css from "./style.module.css";

const Item = (props: ListItemProps) => (
    <div
        ref={createVirtualItemRef(props.model, props.index)}
        class={props.index % 2 ? css.oddItem : css.evenItem}
    >
        col&nbsp;{props.index}
    </div>
);

const HorizontalList = () => {
    const columns = createVirtual({
        itemCount: 50_000,
        estimatedItemSize: 75,
        horizontal: true
    });
    return <List model={columns}>{Item}</List>;
};

export default HorizontalList;
