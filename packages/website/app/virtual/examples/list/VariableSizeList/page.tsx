"use client";

import { useState, memo } from "react";
import { useVirtual, List, ListItemProps } from "@af-utils/virtual-react";

const DEFAULT_ROW_COUNT = 50000;

const Item = memo<ListItemProps>(({ i, model, data: pseudoRandomSizes }) => (
    <div
        ref={el => model.el(i, el)}
        className="text-center border-t border-zinc-800"
        style={{
            lineHeight: `${pseudoRandomSizes[i]}px`,
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
            (_, i) => 50 + ((i ** 2) & 63)
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