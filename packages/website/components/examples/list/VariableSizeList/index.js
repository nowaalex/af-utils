import { useState, memo } from "react";
import { useVirtual, List } from "@af-utils/react-virtual-list";
import times from "lodash/times";

const DEFAULT_ROW_COUNT = 20000;

const Item = memo(({ i, model, data: dynamicListRowHeights }) => (
    <div
        ref={el => model.el(i, el)}
        className="text-center border-t border-zinc-800"
        style={{
            lineHeight: `${dynamicListRowHeights[i]}px`,
            background: `hsl(${(i * 11) % 360},60%,60%)`
        }}
    >
        row {i}:&nbsp;{dynamicListRowHeights[i]}px
    </div>
));

const VariableSizeList = () => {
    const [dynamicListRowHeights] = useState(() =>
        times(DEFAULT_ROW_COUNT, i => 50 + ((i ** 2) & 63))
    );

    const model = useVirtual({
        itemCount: DEFAULT_ROW_COUNT,
        estimatedItemSize: 75
    });

    return (
        <List className="h-full" model={model} itemData={dynamicListRowHeights}>
            {Item}
        </List>
    );
};

export default VariableSizeList;
