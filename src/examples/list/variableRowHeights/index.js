import { useState } from "react";
import List from "af-virtual-scroll/List";
import styled from "styled-components";
import times from "lodash/times";
import r from "lodash/random";

const StyledList = styled(List)`
    flex: 1 1 20em;
    min-width: 12em;
    max-width: 36em;
`;

const StyledRow = styled.div`
    border-top: 1px solid #666;
    color: #000;
    text-align: center;
`;

const DEFAULT_ROW_COUNT = 200000;

const VariableSizeList = () => {

    const [ dynamicListRowHeights ] = useState(() => times( DEFAULT_ROW_COUNT, () => r( 50, 100 ) ));

    return (
        <StyledList
            estimatedRowHeight={75}
            overscanRowsCount={5}
            rowsQuantity={DEFAULT_ROW_COUNT}
        >
            {i => (
                <StyledRow key={i} style={{
                    lineHeight: `${dynamicListRowHeights[i]}px`,
                    background: `hsl(${i*11%360},60%,60%)`
                }}>
                    row {i}:&nbsp;{dynamicListRowHeights[i]}px
                </StyledRow>
            )}
        </StyledList>
    );
}

export default VariableSizeList;