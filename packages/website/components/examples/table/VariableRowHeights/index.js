import { useState, useMemo } from "react";
import { useVirtual, Table } from "@af-utils/react-table";

const DEFAULT_ROW_COUNT = 100000;

const VariableSizeTable = () => {
    const [pseudoRandomSizes] = useState(() =>
        Array.from(
            { length: DEFAULT_ROW_COUNT },
            (_, i) => 30 + ((i ** 2) & 63)
        )
    );

    const model = useVirtual({
        itemCount: DEFAULT_ROW_COUNT,
        estimatedItemSize: 60
    });

    const columns = useMemo(
        () => [
            {
                key: "a",
                label: "a",
                align: "center",
                render: cellData => (
                    <div
                        style={{
                            color: "#000",
                            lineHeight: `${pseudoRandomSizes[cellData]}px`,
                            background: `hsl(${(cellData * 11) % 360},60%,60%)`
                        }}
                    >
                        {cellData}
                    </div>
                )
            },
            { key: "b", label: "b", align: "center" },
            { key: "c", label: "c", align: "center" }
        ],
        [pseudoRandomSizes]
    );

    return (
        <Table
            model={model}
            className="h-full basic-table-container"
            getRowData={i => ({
                a: i,
                b: `cell_b_${i}`,
                c: `cell_c_${i}`
            })}
            columns={columns}
        />
    );
};

export default VariableSizeTable;
