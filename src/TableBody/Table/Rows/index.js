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
    CellComponent
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
            />
        );
    }
    return result;
};

const Rows = memo(({ getRowData, getRowKey, getRowExtraProps, RowComponent, CellComponent }) => {

    const API = useApiPlugin( SUBSCRIBE_EVENTS );

    useLayoutEffect(() => {
        API.reportRowsRendered();
    });

    return getVisibleRows(
        API.startIndex,
        API.endIndex,
        API.columns,
        getRowData,
        getRowKey,
        getRowExtraProps,
        RowComponent,
        CellComponent
    );
});

export default Rows;