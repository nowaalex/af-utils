import { useState } from "react";
import Table from  "af-virtual-scroll/Table";
import styled from "styled-components";
import times from "lodash/times";
import r from "lodash/random";

const StyledTable = styled(Table)`
    flex: 1 1 20em;
    min-width: 20em;
    max-width: 50em;
`;


const DEFAULT_ROW_COUNT = 100000;

const VariableSizeTable = () => {

    const [ dynamicListRowHeights ] = useState(() => times( DEFAULT_ROW_COUNT, () => r( 100, 200 ) ));

    return (
        <StyledTable
            getRowData={i => ({ a: `cell_a_${i}`, b: `cell_b_${i}`, c: `cell_c_${i}` })}
            columns={[ "a", "b", "c" ]}
            getCellExtraProps={( rowData, colIndex, rowIndex ) => ({
                style: {
                    color: "#000",
                    textAlign: "center",
                    height: `${dynamicListRowHeights[rowIndex]}px`,
                    background: `hsl(${rowIndex*11%360},${(colIndex+1)* Math.round( 50 / 3 ) + 45}%,60%)`
                }
            })}
            estimatedRowHeight={150}
            overscanRowsCount={5}
            rowsQuantity={DEFAULT_ROW_COUNT}
        />
    );
}

export default VariableSizeTable;