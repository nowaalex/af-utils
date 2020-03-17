import React from "react";
import Table from "af-virtual-scroll/lib/Table";
import r from "lodash/random";
import times from "lodash/times";
import faker from "faker";

const DFMT = new Intl.DateTimeFormat();
const NFMT = new Intl.NumberFormat();

const columns = [
    {
        dataKey: "num",
        label: "Numeric",
        sort: "numeric",
        format: cellData => NFMT.format( cellData ),
    },
    {
        dataKey: "str",
        label: "String",
        sort: "locale"
    },
    {
        dataKey: "timeStamp",
        label: "Date",
        format: cellData => DFMT.format( cellData ),
        sort: "numeric"
    }
];

const rowCount = 5000;

const rows = times( rowCount, () => ({
    num: r( 1, 20000 ) / 27,
    str: faker.name.findName(),
    timeStamp: r( 0, Date.now() )
}));

const getRowData = index => rows[ index ];

const TableWithFormattedCell = ({ className }) => (
    <Table
        className={className}
        getRowData={getRowData}
        rowCount={rowCount}
        columns={columns}
    />
);

export default TableWithFormattedCell;