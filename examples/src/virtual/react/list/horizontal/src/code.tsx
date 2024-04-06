import { memo } from "react";
import { useVirtual, List, ListItemProps } from "@af-utils/virtual-react";
import css from "./style.module.css";

const Item = memo<ListItemProps>(({ i, model }) => (
    <div
        ref={el => model.el(i, el)}
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
