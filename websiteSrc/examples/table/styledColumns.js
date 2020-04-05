import React from "react";
import Table from "af-virtual-scroll/lib/Table";
import times from "lodash/times";
import range from "lodash/range";
import r from "lodash/random";
import { css } from "@emotion/core";

const wrapperCss = css`
    table {
        border-spacing: 0;
    }
    tr[data-odd]{
        background: rgba(0,0,0,0.2)
    }
`;

const colCount = 5;

const getRowExtraProps = ( rowData, rowDataIndex ) => rowDataIndex % 2 ? { "data-odd": "" } : null;

const columns = times( colCount, colIndex => ({
    dataKey: `col${colIndex}`,
    label: `col${colIndex}`,
    background: `hsl(${Math.floor(360/colCount*colIndex)},80%,80%)`,
    width: r( 50, 300 )
}));

const getRowData = index => range( colCount ).reduce(( acc, colIndex ) => {
    acc[ `col${colIndex}` ] = index;
    return acc;
}, {});

const totals = range( colCount ).reduce(( acc, colIndex ) => {
    acc[ `col${colIndex}` ] = [ "count" ];
    return acc;
}, {});

const TableWithStyledColumns = ({ className }) => (
    <Table
        getRowExtraProps={getRowExtraProps}
        css={wrapperCss}
        className={className}
        getRowData={getRowData}
        rowCount={500}
        totals={totals}
        columns={columns}
    />
);

export default TableWithStyledColumns;