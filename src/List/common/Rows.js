import React, { useEffect } from "react";
import useApi from "../../useApi";

const SUBSCRIBE_EVENTS = [
    "#startIndex",
    "#endIndex",
    "#rowKeyGetter",
    "#rowDataGetter"
];

const getVisibleRows = (
    rangeFrom,
    rangeTo,
    getRowData,
    getRowKey,
    getRowExtraProps,
    RowComponent
) => {
    const result = [];
    for( let rowKey; rangeFrom < rangeTo; rangeFrom++ ){
        rowKey = getRowKey ? getRowKey( rangeFrom ) : rangeFrom;
        result.push(
            <RowComponent
                getRowExtraProps={getRowExtraProps}
                rowIndex={rangeFrom}
                key={rowKey}
                getRowData={getRowData}
            />
        );
    }
    return result;
};

const Rows = ({ getRowExtraProps, RowComponent }) => {

    const API = useApi( SUBSCRIBE_EVENTS );

    useEffect(() => {
        API.emit( "rows-rendered" );
    });

    return getVisibleRows(
        API.startIndex,
        API.endIndex,
        API.rowDataGetter,
        API.rowKeyGetter,
        getRowExtraProps,
        RowComponent
    );
};

export default Rows;