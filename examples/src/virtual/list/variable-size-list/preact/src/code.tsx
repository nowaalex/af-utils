import type { ListItemProps } from "@af-utils/virtual-preact";
import { List, useVirtual, useVirtualItemRef } from "@af-utils/virtual-preact";
import { memo, useState } from "preact/compat";
import css from "./style.module.css";

const DEFAULT_ROW_COUNT = 50000;

const Item = memo<ListItemProps<number[]>>(({ model, index, data }) => {
    const pseudoRandomSizes = data as number[];

    return (
        <div
            ref={useVirtualItemRef(model, index)}
            className={css.item}
            role="listitem"
            aria-posinset={index + 1}
            aria-setsize={pseudoRandomSizes.length}
            style={{
                padding: `${pseudoRandomSizes[index]}px 0`,
                background: `hsl(${(index * 11) % 360},60%,60%)`
            }}
        >
            row {index}:&nbsp;{pseudoRandomSizes[index]}px
        </div>
    );
});

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
        <List
            className={css.list}
            model={model}
            itemData={pseudoRandomSizes}
            role="list"
        >
            {Item}
        </List>
    );
};

export default VariableSizeList;
