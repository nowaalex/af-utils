import { useState } from "react";
import { Table } from  "af-virtual-scroll";
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

    const columns = [
        {
            dataKey: "a",
            label: "a",
            render: ( cellData ) => (
                <div style={{
                    color: "#000",
                    textAlign: "center",
                    lineHeight: `${dynamicListRowHeights[cellData]}px`,
                    background: `hsl(${cellData*11%360},60%,60%)`
                }}>
                    {cellData}
                </div>
            )
        },
        { dataKey: "b", label: "b" },
        { dataKey: "c", label: "c" }
    ];

    return (
        <StyledTable
            getRowData={i => ({ a: i, b: `cell_b_${i}`, c: `cell_c_${i}` })}
            columns={columns}
            estimatedRowHeight={150}
            rowsQuantity={DEFAULT_ROW_COUNT}
        />
    );
}

export default VariableSizeTable;