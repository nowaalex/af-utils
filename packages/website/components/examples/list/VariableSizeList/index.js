import { useState, memo } from "react";
import { useVirtual, areIndexesEqual, List } from "@af-utils/react-virtual-list";
import times from "lodash/times";
import r from "lodash/random";

const DEFAULT_ROW_COUNT = 20000;

const Item = memo(({ i, data: dynamicListRowHeights }) => (
    <div
        className="text-center border-t border-zinc-800"
        style={{
            lineHeight: `${dynamicListRowHeights[i]}px`,
            background: `hsl(${i*11%360},60%,60%)`
        }}
    >
        row {i}:&nbsp;{dynamicListRowHeights[i]}px
    </div>
), areIndexesEqual );

const VariableSizeList = () => {

    const [ dynamicListRowHeights ] = useState(() => times(
        DEFAULT_ROW_COUNT,
        () => r( 50, 100 )
    ));

    const model = useVirtual({
        itemCount: DEFAULT_ROW_COUNT,
        estimatedItemSize: 75
    });

    return (
        <List model={model} itemData={dynamicListRowHeights}>
            {Item}
        </List>
    );
}

export default VariableSizeList;