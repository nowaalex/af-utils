import React from "react";
import Table from "af-virtual-scroll/lib/Table";
import r from "lodash/random";
import times from "lodash/times";
import faker from "faker";

const columns = [
    {
        dataKey: "num",
        label: "Numeric",
        sort: "numeric"
    },
    {
        dataKey: "str",
        label: "String",
        sort: "locale"
    }
];

const rowCount = 5000;

const rows = times( rowCount, () => ({
    num: r( 1, 20000 ),
    str: faker.name.findName()
}));

const getRowData = index => rows[ index ];

const SortableTable = () => (
    <Table
        getRowData={getRowData}
        rowCount={rowCount}
        columns={columns}
    />
);

export default SortableTable;