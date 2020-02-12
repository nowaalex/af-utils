import React, { memo, useLayoutEffect } from "react";
import { useApiPlugin } from "../../../useApi";

const SUBSCRIBE_EVENTS = [
    "visible-rows-range-changed",
    "columns-changed"
];


const getVisibleRows = (
    rangeFrom,
    rangeTo,
    columns,
    getRowData,
    getRowKey,
    getRowExtraProps,
    RowComponent,
    CellComponent,
    EmptyDataRowComponent
) => {
    const result = [];
    for( let j = rangeFrom, rowKey; j < rangeTo; j++ ){
        rowKey = getRowKey ? getRowKey( j ) : j;
        result.push(
            <RowComponent
                getRowExtraProps={getRowExtraProps}
                rowIndex={j}
                key={rowKey}
                columns={columns}
                getRowData={getRowData}
                CellComponent={CellComponent}
                EmptyDataRowComponent={EmptyDataRowComponent}
            />
        );
    }
    return result;
};

const Rows = memo(({ getRowData, getRowKey, getRowExtraProps, RowComponent, CellComponent, EmptyDataRowComponent }) => {

    const { startIndex, endIndex, Events, columns } = useApiPlugin( SUBSCRIBE_EVENTS );

    useLayoutEffect(() => {
        Events.emit( "tbody-rows-rendered" );
    });

    return getVisibleRows(
        startIndex,
        endIndex,
        columns,
        getRowData,
        getRowKey,
        getRowExtraProps,
        RowComponent,
        CellComponent,
        EmptyDataRowComponent
    );
});

export default Rows;