import React from "react";
import { observer } from "mobx-react-lite";
import useApi from "../../useApi";

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

    const { startIndex, endIndex, getRowData, getRowKey } = useApi();

    return getVisibleRows(
        startIndex,
        endIndex,
        getRowData,
        getRowKey,
        getRowExtraProps,
        RowComponent
    );
};

export default observer( Rows );