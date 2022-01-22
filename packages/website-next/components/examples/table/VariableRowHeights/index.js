import { useState } from "react";
import { Table, useVirtual } from  "af-virtual-scroll";
import times from "lodash/times";
import r from "lodash/random";

const DEFAULT_ROW_COUNT = 100000;

const VariableSizeTable = () => {

    const [ dynamicListRowHeights ] = useState(() => times(
        DEFAULT_ROW_COUNT,
        () => r( 100, 200 )
    ));

    const model = useVirtual({
        itemCount: DEFAULT_ROW_COUNT,
        estimatedItemSize: 150
    })

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
        <Table
            model={model}
            getRowData={i => ({
                a: i,
                b: `cell_b_${i}`,
                c: `cell_c_${i}`
            })}
            columns={columns}
        />
    );
}

export default VariableSizeTable;