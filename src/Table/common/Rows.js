import React, { useEffect } from "react";
import useApi from "../../useApi";

const SUBSCRIBE_EVENTS = [
    "#startIndex",
    "#endIndex",
    "#columns",
    "#rowsOrder",
    "#getRowKey",
    "#getCellData",
    "#getRowData"
];

const getVisibleRows = (
    orderedRows,
    rangeFrom,
    rangeTo,
    columns,
    getRowData,
    getCellData,
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
                getCellData={getCellData}
                CellComponent={CellComponent}
            />
        );
    }
    return result;
};

const Rows = ({ getRowExtraProps, getCellExtraProps, RowComponent, CellComponent }) => {

    const API = useApi( SUBSCRIBE_EVENTS );

    return getVisibleRows(
        API.orderedRows,
        API.startIndex,
        API.endIndex,
        API.columns,
        API.getRowData,
        API.getCellData,
        API.getRowKey,
        getRowExtraProps,
        getCellExtraProps,
        RowComponent,
        CellComponent
    );
};

export default Rows;