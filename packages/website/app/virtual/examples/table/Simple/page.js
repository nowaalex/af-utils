"use client";

import { useTable, Root } from "@af-utils/react-table";

const columns = [
    { key: "a", label: "a" },
    { key: "b", label: "b" },
    { key: "c", label: "c" }
];

const getRowData = i => ({
    a: `cell_a_${i}`,
    b: `cell_b_${i}`,
    c: `cell_c_${i}`
});

const SimpleTable = () => {
    const model = useTable({
        columns,
        rowCount: 10,
        getRowData,
        getRowKey: d => d.a
    });

    return <Root model={model} />;
};

export default SimpleTable;
