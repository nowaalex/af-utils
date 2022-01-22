import { useState } from "react";
import { VerticalList, useVirtual } from "af-virtual-scroll";
import times from "lodash/times";
import r from "lodash/random";

// import once in a project ( not needed for hook )
// import "af-virtual-scroll/lib/style.css";

const DEFAULT_ROW_COUNT = 2000;

const VariableSizeList = () => {

    const [ dynamicListRowHeights ] = useState(() => times( DEFAULT_ROW_COUNT, () => r( 50, 100 ) ));

    const model = useVirtual({
        itemCount: DEFAULT_ROW_COUNT
    });

    return (
        <VerticalList model={model}>
            {i => (
                <div key={i} className="text-center border-t border-zinc-800" style={{
                    lineHeight: `${dynamicListRowHeights[i]}px`,
                    background: `hsl(${i*11%360},60%,60%)`
                }}>
                    row {i}:&nbsp;{dynamicListRowHeights[i]}px
                </div>
            )}
        </VerticalList>
    );
}

export default VariableSizeList;