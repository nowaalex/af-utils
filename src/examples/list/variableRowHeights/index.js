import { useState } from "react";
import List from "components/List";
import styled from "styled-components";
import times from "lodash/times";
import r from "lodash/random";

const StyledList = styled(List)`
    height: 80vh;
    width: 600px;
`;

const DEFAULT_ROW_COUNT = 60;

const VariableSizeList = () => {

    const [ dynamicListRowHeights ] = useState(() => times( DEFAULT_ROW_COUNT, () => r( 50, 250 ) ))
    return (
        <StyledList
            getRowData={
                i => (
                    <div style={{
                        lineHeight: `${dynamicListRowHeights[i]}px`,
                        borderTop: "1px solid #666",
                        background: `hsl(${r(0,360)},${r(30,80)}%,${r(30,80)}%)`
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