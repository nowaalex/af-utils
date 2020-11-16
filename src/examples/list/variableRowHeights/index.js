import { useState } from "react";
import List from "af-virtual-scroll/List";
import styled from "styled-components";
import times from "lodash/times";
import r from "lodash/random";

const StyledList = styled(List)`
    height: 80vh;
    width: 600px;
`;

const DEFAULT_ROW_COUNT = 60000;

const VariableSizeList = () => {

    const [ dynamicListRowHeights ] = useState(() => times( DEFAULT_ROW_COUNT, () => r( 100, 200 ) ))
    return (
        <StyledList
            getRowData={
                i => (
                    <div style={{
                        lineHeight: `${dynamicListRowHeights[i]}px`,
                        borderTop: "1px solid #666",
                        background: `hsl(${i*11%360},60%,60%)`
                    }}>
                        row {i}:&nbsp;{dynamicListRowHeights[i]}px
                    </div>
                )
            }
            overscanRowsCount={10}
            rowsQuantity={DEFAULT_ROW_COUNT}
        />
    );
}

export default VariableSizeList;