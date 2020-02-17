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
    for( let rowKey; rangeFrom < rangeTo; rangeFrom++ ){
        rowKey = getRowKey ? getRowKey( rangeFrom ) : rangeFrom;
        result.push(
            <RowComponent
                getRowExtraProps={getRowExtraProps}
                rowIndex={rangeFrom}
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