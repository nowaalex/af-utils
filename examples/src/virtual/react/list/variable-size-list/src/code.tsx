import { useState, memo } from "react";
import { useVirtual, List, createListItemRef } from "@af-utils/virtual-react";
import type { ListItemProps } from "@af-utils/virtual-react";
import css from "./style.module.css";

const DEFAULT_ROW_COUNT = 50000;

const Item = memo<ListItemProps>(({ model, i, data: pseudoRandomSizes }) => (
    <div
        ref={createListItemRef(model, i)}
        className={css.item}
        style={{
            padding: `${pseudoRandomSizes[i]}px 0`,
            background: `hsl(${(i * 11) % 360},60%,60%)`
        }}
    >
        row {i}:&nbsp;{pseudoRandomSizes[i]}px
    </div>
));

const VariableSizeList = () => {
    const [pseudoRandomSizes] = useState(() =>
        Array.from(
            { length: DEFAULT_ROW_COUNT },
            (_, i) => 20 + ((i ** 2) & 31)
        )
    );

    const model = useVirtual({
        itemCount: DEFAULT_ROW_COUNT,
        estimatedItemSize: 75
    });

    return (
        <List model={model} itemData={pseudoRandomSizes}>
            {Item}
        </List>
    );
};

export default VariableSizeList;
