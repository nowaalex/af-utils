import React from "react";
import Table from "./index";
import r from "lodash/random";
import times from "lodash/times";

export default { title: "Table" };
/*
const DEFAULT_ROW_COUNT = 50000;

const columns = [
    {
        dataKey: "a",
        label: "a",
        sort: "numeric"
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

export const FixedTable = () => (
    <Table
        fixedSize
        getRowData={
            index => ({
                a: index,
                b: `cell_b_row: ${index}`,
                c: `cell_c_row: ${index}`
            })
        }
        rowCount={DEFAULT_ROW_COUNT}
        columns={columns}
    />
);*/