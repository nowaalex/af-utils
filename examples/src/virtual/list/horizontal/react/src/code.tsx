import {
    List,
    type ListItemProps,
    useVirtual,
    useVirtualItemRef
} from "@af-utils/virtual-react";
import { memo } from "react";
import css from "./style.module.css";

const Item = memo<ListItemProps>(({ model, index }) => (
    <div
        ref={useVirtualItemRef(model, index)}
        className={index % 2 ? css.oddItem : css.evenItem}
        role="listitem"
        aria-posinset={index + 1}
        aria-setsize={model.itemCount}
    >
        col&nbsp;{index}
    </div>
));

const HorizontalList = () => {
    const cols = useVirtual({
        itemCount: 50000,
        estimatedItemSize: 75,
        horizontal: true
    });

    return (
        <List model={cols} role="list" aria-label="Horizontal virtual list">
            {Item}
        </List>
    );
};

export default HorizontalList;
