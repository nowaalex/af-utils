import React from "react";
import Table from "af-virtual-scroll/lib/Table";
import r from "lodash/random";
import times from "lodash/times";
import faker from "faker";
import { css } from "@emotion/core";

const tableCss = css`
    th, tfoot td {
        background: #fff;
    }
`;

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

/*
    Table measures row heights automatically.
    estimatedRowHeight is not necessary,
    it makes table a little smoother.
    In future this prop may be removed.
*/
const VariableRowHeightsTable = ({ className }) => (
    <Table
        css={tableCss}
        className={className}
        useStickyIfPossible
        totals={totals}
        getRowData={getRowData}
        rowCount={rowCount}
        columns={columns}
        estimatedRowHeight={120}
    />
);

export default VariableRowHeightsTable;