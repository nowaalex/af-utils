import { memo } from "react";
import useModelSubscription from "hooks/useModelSubscription";

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

const ROWS_SUBSCRIPTIONS = [ "startIndex", "endIndex", "getRowData", "getRowKey" ]

const Rows = ({ getRowExtraProps, RowComponent }) => {

    const { startIndex, endIndex, getRowData, getRowKey } = useModelSubscription( ROWS_SUBSCRIPTIONS );

    return getVisibleRows(
        startIndex,
        endIndex,
        getRowData,
        getRowKey,
        getRowExtraProps,
        RowComponent
    );
};

export default memo( Rows );