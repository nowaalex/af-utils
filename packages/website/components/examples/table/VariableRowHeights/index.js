import { useState, useMemo } from "react";
import { useVirtual, Table } from "@af-utils/react-table";
import times from "lodash/times";
import r from "lodash/random";

const DEFAULT_ROW_COUNT = 100000;

const VariableSizeTable = () => {

    const [ dynamicListRowHeights ] = useState(() => times(
        DEFAULT_ROW_COUNT,
        () => r( 30, 90 )
    ));

    const model = useVirtual({
        itemCount: DEFAULT_ROW_COUNT,
        estimatedItemSize: 60
    });

    const columns = useMemo(() => [
        {
            key: "a",
            label: "a",
            align: 'center',
            render: ( cellData ) => (
                <div style={{
                    color: "#000",
                    lineHeight: `${dynamicListRowHeights[cellData]}px`,
                    background: `hsl(${cellData*11%360},60%,60%)`
                }}>
                    {cellData}
                </div>
            )
        },
        { key: "b", label: "b", align: 'center' },
        { key: "c", label: "c", align: 'center' }
    ], [ dynamicListRowHeights ]);

    return (
        <Table
            model={model}
            className="basic-table-container"
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