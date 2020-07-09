import React from "react";
import Table from "af-virtual-scroll/lib/Table";
import r from "lodash/random";
import times from "lodash/times";
import faker from "faker";

const columns = [
    {
        dataKey: "rowIndex",
        label: "Row index",
        getCellData: ( rowData, i ) => i
    },
    {
        dataKey: "num",
        label: "Numeric",
        sort: "numeric"
    },
    {
        dataKey: "str",
        label: "String",
        sort: "locale"
    },
    {
        dataKey: "rect",
        label: "Rectangle",
        render: cellData => (
            <div style={{
                lineHeight: `${cellData}px`,
                background: `hsl(${r(0,360)},50%,50%)`
            }}>
                height: {cellData}px
            </div>
        )
    }
];

const rowCount = 100000;

const rows = times( rowCount, () => ({
    num: r( 1, 20000 ),
    str: faker.name.findName(),
    rect: r( 50, 250 )
}));

const getRowData = index => rows[ index ];

const totals = {
    num: [ "sum", "count" ]
};

const VariableRowHeightsTable = ({ className }) => (
    <Table
        className={className}
        totals={totals}
        getRowData={getRowData}
        estimatedRowHeight={300}
        rowCount={rowCount}
        columns={columns}
    />
);

export default VariableRowHeightsTable;