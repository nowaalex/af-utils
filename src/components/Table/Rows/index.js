import { memo } from "react";
import useModelSubscription from "hooks/useModelSubscription";

const getVisibleRows = (
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
    for( let key; rangeFrom < rangeTo; rangeFrom++ ){

        key = getRowKey ? getRowKey( rangeFrom ) : rangeFrom;

        result.push(
            <RowComponent
                getRowExtraProps={getRowExtraProps}
                getCellExtraProps={getCellExtraProps}
                rowIndex={rangeFrom}
                rowDataIndex={rangeFrom}
                key={key}
                columns={columns}
                getRowData={getRowData}
                CellComponent={CellComponent}
            />
        );
    }
    return result;
};

const ROWS_SUBSCRIPTIONS = [ "startIndex", "endIndex", "normalizedVisibleColumns", "getRowData", "getRowKey" ];

const Rows = ({ getRowExtraProps, getCellExtraProps, RowComponent, CellComponent }) => {

    const API = useModelSubscription( ROWS_SUBSCRIPTIONS );

    return getVisibleRows(
        API.startIndex,
        API.endIndex,
        API.normalizedVisibleColumns,
        API.getRowData,
        API.getRowKey,
        getRowExtraProps,
        getCellExtraProps,
        RowComponent,
        CellComponent
    );
};

export default memo( Rows );