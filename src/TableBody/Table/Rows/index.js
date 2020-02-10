import React, { memo, useLayoutEffect } from "react";
import { useApiPlugin } from "../../../useApi";

const SUBSCRIBE_EVENTS = [
    "visible-rows-range-changed",
    "columns-changed"
];

const Cell = ({ rowData, columnIndex, column }) => {
    const { transformCellData, dataKey } = column;
    const cellData = rowData[ dataKey ];
    return (
        <td key={dataKey}>
            {transformCellData?transformCellData(cellData,rowData,columnIndex):cellData}
        </td>
    );
};

const Row = ({ columns, getRowData, getRowExtraProps, rowIndex, EmptyDataRowComponent }) => {

    const rowData = getRowData( rowIndex );

    return rowData ? (
        <tr {...getRowExtraProps( rowData, rowIndex )}>
            {columns.map(( column, columnIndex ) => (
                <Cell
                    key={column.dataKey}
                    rowData={rowData}
                    columnIndex={columnIndex}
                    column={column}
                />
            ))}
        </tr>
    ) : (
        <EmptyDataRowComponent rowIndex={rowIndex} columns={columns} />
    );
};


const getVisibleRows = (
    rangeFrom,
    rangeTo,
    columns,
    getRowData,
    getRowKey,
    getRowExtraProps,
    EmptyDataRowComponent
) => {
    const result = [];
    for( let j = rangeFrom, rowKey; j < rangeTo; j++ ){
        rowKey = getRowKey ? getRowKey( j ) : j;
        result.push(
            <Row
                getRowExtraProps={getRowExtraProps}
                rowIndex={j}
                key={rowKey}
                columns={columns}
                getRowData={getRowData}
                EmptyDataRowComponent={EmptyDataRowComponent}
            />
        );
    }
    return result;
};

const Rows = memo(({ getRowData, getRowKey, getRowExtraProps, EmptyDataRowComponent }) => {

    const { startIndex, endIndex, Events, columns } = useApiPlugin( SUBSCRIBE_EVENTS );

    useLayoutEffect(() => {
        Events.emit( "tbody-rows-rendered", startIndex, endIndex );
    });

    return getVisibleRows(
        startIndex,
        endIndex,
        columns,
        getRowData,
        getRowKey,
        getRowExtraProps,
        EmptyDataRowComponent
    );
});

export default Rows;