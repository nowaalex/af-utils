import React, { memo, useEffect } from "react";
import { useApiPlugin } from "../../../useApi";

const SUBSCRIBE_EVENTS = [
    "start-index-changed",
    "end-index-changed",
    "columns-changed",
    "rows-order-changed",
    "row-key-getter-changed",
    "row-data-getter-changed"
];


const getVisibleRows = (
    orderedRows,
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
        idx = orderedRows[ rangeFrom ];
        rowKey = getRowKey ? getRowKey( idx ) : idx;
        result.push(
            <RowComponent
                getRowExtraProps={getRowExtraProps}
                rowIndex={rangeFrom}
                rowDataIndex={idx}
                key={rowKey}
                columns={columns}
                getRowData={getRowData}
                CellComponent={CellComponent}
            />
        );
    }
    return result;
};

const Rows = memo(({ getRowExtraProps, RowComponent, CellComponent }) => {

    const API = useApiPlugin( SUBSCRIBE_EVENTS );

    useEffect(() => {
        API.reportRowsRendered();
    });

    return getVisibleRows(
        API.orderedRows,
        API.startIndex,
        API.endIndex,
        API.columns,
        API.rowDataGetter,
        API.rowKeyGetter,
        getRowExtraProps,
        RowComponent,
        CellComponent
    );
});

export default Rows;