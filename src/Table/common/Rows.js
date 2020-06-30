import React from "react";
import { observer } from "mobx-react-lite";
import useApi from "../../useApi";
import GroupRow from "./GroupRow";

const getVisibleRows = (
    { rowIndexes, groupKeyPaths },
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
    for( let tmp, idx; rangeFrom < rangeTo; rangeFrom++ ){
        idx = rowIndexes[ rangeFrom ];

        if( idx >= 0 ){
            tmp = getRowKey ? getRowKey( idx ) : idx;
            result.push(
                <RowComponent
                    getRowExtraProps={getRowExtraProps}
                    getCellExtraProps={getCellExtraProps}
                    rowIndex={rangeFrom}
                    rowDataIndex={idx}
                    key={tmp}
                    columns={columns}
                    getRowData={getRowData}
                    getCellData={getCellData}
                    CellComponent={CellComponent}
                />
            );
        }
        else {
            tmp = groupKeyPaths[~idx];
            result.push(
                <GroupRow
                    key={`group_${tmp.join("/")}`}
                    groupPath={tmp}
                    columns={columns}
                    rowIndex={rangeFrom}
                />
            );
        }
    }
    return result;
};

const Rows = ({ getRowExtraProps, getCellExtraProps, RowComponent, CellComponent }) => {

    const API = useApi();

    return getVisibleRows(
        API.Rows.flat,
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

export default observer( Rows );