import { memo } from "react";
import {
    useVirtual,
    List,
    type ListItemProps,
    useVirtualItemRef
} from "@af-utils/virtual-react";
import css from "./style.module.css";

const Item = memo<ListItemProps>(({ model, index }) => (
    <div
        ref={useVirtualItemRef(model, index)}
        className={index % 2 ? css.oddItem : css.evenItem}
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

    return <List model={cols}>{Item}</List>;
};

export default HorizontalList;
