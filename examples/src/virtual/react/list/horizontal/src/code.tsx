import { memo } from "react";
import {
    useVirtual,
    List,
    ListItemProps,
    createListItemRef
} from "@af-utils/virtual-react";
import css from "./style.module.css";

const Item = memo<ListItemProps>(({ model, i }) => (
    <div
        ref={createListItemRef(model, i)}
        className={i % 2 ? css.oddItem : css.evenItem}
    >
        col&nbsp;{i}
    </div>
));

const HorizontalList = () => {
    const cols = useVirtual({
        itemCount: 50000,
        estimatedItemSize: 75,
        horizontal: true
    });

    return <List model={cols}>{Item}</List>;
};

export default HorizontalList;
