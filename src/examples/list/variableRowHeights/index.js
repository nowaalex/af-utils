import { useState } from "react";
import List from "af-virtual-scroll/List";
import styled from "styled-components";
import times from "lodash/times";
import r from "lodash/random";

const StyledList = styled(List)`
    flex: 1 1 10em;
    min-width: 150px;
`;

const StyledRow = styled.div`
    border-top: 1px solid #666;
    color: #000;
    text-align: center;
`;

const DEFAULT_ROW_COUNT = 100000;

const VariableSizeList = () => {

    const [ dynamicListRowHeights ] = useState(() => times( DEFAULT_ROW_COUNT, () => r( 100, 200 ) ));

    return (
        <StyledList
            getRowData={
                i => (
                    <StyledRow style={{
                        lineHeight: `${dynamicListRowHeights[i]}px`,
                        background: `hsl(${i*11%360},60%,60%)`
                    }}>
                        row {i}:&nbsp;{dynamicListRowHeights[i]}px
                    </StyledRow>
                )
            }
            estimatedRowHeight={150}
            overscanRowsCount={5}
            rowsQuantity={DEFAULT_ROW_COUNT}
        />
    );
}

export default VariableSizeList;