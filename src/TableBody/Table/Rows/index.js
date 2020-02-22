import React, { memo, useEffect } from "react";
import { useApiPlugin } from "../../../useApi";

const SUBSCRIBE_EVENTS = [
    "start-index-changed",
    "end-index-changed",
    "columns-changed",
    "rows-order-changed"
];


const getVisibleRows = (
    rowsOrder,
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
    for( let rowKey, idx; rangeFrom < rangeTo; rangeFrom++ ){
        idx = rowsOrder[ rangeFrom ];
        rowKey = getRowKey ? getRowKey( idx ) : idx;
        result.push(
            <RowComponent
                getRowExtraProps={getRowExtraProps}
                rowIndex={idx}
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

    useEffect(() => {
        API.reportRowsRendered();
    });

    return getVisibleRows(
        API.rowsOrder,
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