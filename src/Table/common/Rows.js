import React, { useEffect } from "react";
import useApi from "../../useApi";

const SUBSCRIBE_EVENTS = [
    "#startIndex",
    "#endIndex",
    "#columns",
    "#rowsOrder",
    "#rowKeyGetter",
    "#rowDataGetter"
];

const getVisibleRows = (
    orderedRows,
    rangeFrom,
    rangeTo,
    columns,
    getRowData,
    getRowKey,
    getRowExtraProps,
    getCellExtraProps,
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
                getCellExtraProps={getCellExtraProps}
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

const Rows = ({ getRowExtraProps, getCellExtraProps, RowComponent, CellComponent }) => {

    const API = useApi( SUBSCRIBE_EVENTS );

    useEffect(() => {
        API.emit( "rows-rendered" );
    });

    return getVisibleRows(
        API.orderedRows,
        API.startIndex,
        API.endIndex,
        API.columns,
        API.rowDataGetter,
        API.rowKeyGetter,
        getRowExtraProps,
        getCellExtraProps,
        RowComponent,
        CellComponent
    );
};

export default Rows;