import React from "react";
import Table from "af-virtual-scroll/src/Table";
import r from "lodash/random";
import times from "lodash/times";

const columns = [
    { dataKey: "n1", label: "N1" },
    { dataKey: "n2", label: "N2" },
    { dataKey: "n3", label: "N3" },
    { dataKey: "n4", label: "N4" },
];

const rowCount = 5000;

const rows = times( rowCount, () => ({
    n1: r( 1, 20000 ),
    n2: r( 1, 20000 ),
    n3: r( 1, 20000 ),
    n4: r( 1, 20000 )
}));

const totals = {
    n1: [ "count" ],
    n2: [ "sum", "max" ],
    n3: [ "average", "min" ],
    n4: [ "count", "sum", "average" ]
};

const getRowData = index => rows[ index ];

const TableWithTotals = ({ className }) => (
    <Table
        className={className}
        getRowData={getRowData}
        rowCount={rowCount}
        columns={columns}
        totals={totals}
    />
);

export default TableWithTotals;