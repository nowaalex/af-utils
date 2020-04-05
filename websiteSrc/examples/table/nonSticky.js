import React from "react";
import Table from "af-virtual-scroll/lib/Table";

const columns = [
    {
        dataKey: "a",
        label: "a"
    },
    {
        dataKey: "b",
        label: "b"
    },
    {
        dataKey: "c",
        label: "c"
    }
];

const getRowData = index => ({
    a: index,
    b: `cell_b_row: ${index}`,
    c: `cell_c_row: ${index}`
})

const NonStickyTable = ({ className }) => (
    <Table
        className={className}
        getRowData={getRowData}
        nonSticky
        rowCount={500}
        columns={columns}
    />
);

export default NonStickyTable;