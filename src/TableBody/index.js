import React, { forwardRef, useMemo, memo } from "react";
import areEqualBy from "../utils/areEqualBy";

const MEMO_PROPS = [
    "height",
    "width",
    "onScroll",
    "virtualizedScroll",
    "RowComponent",
    "CellComponent",
    "VirtualizedTableCellHeightControllerComponent",
    "TbodyComponent",
    "TableComponent",
    "TableBodyWrapperComponent",
    "EmptyDataRowComponent",
    "currentHorizontalScrollbarOffset",
    "rowsChangeHash",
    "rowHeight",
    "getVisibleRows",
    "getRowData",
    "getRowKey",
    "getRowExtraProps",
    "columns",
    "rowCount",
    "mapCells",
    "getCellData",
    "bodyTableLayoutFixed"
];

const TableBody = memo(forwardRef(({
    height,
    width,
    RowComponent,
    CellComponent,
    TbodyComponent,
    TableBodyWrapperComponent,
    EmptyDataRowComponent,
    bodyTableLayoutFixed,
    rowsChangeHash,
    onScroll,
    rowHeight,
    virtualizedScroll,
    getVisibleRows,
    getRowData,
    getRowKey,
    getRowExtraProps,
    columns,
    rowCount,
    mapCells,
    getCellData,
    TableComponent,
    currentHorizontalScrollbarOffset
}, ref ) => {

    const visibleRows = getVisibleRows(
        0,
        rowCount,
        columns,
        getRowData,
        getRowKey,
        getRowExtraProps,
        RowComponent,
        mapCells,
        getCellData,
        CellComponent,
        EmptyDataRowComponent
    );

    if( process.env.NODE_ENV !== "production" ){
        if( virtualizedScroll ){
            if( visibleRows.filter( row => !!row ).length !== rowCount ){
                throw new Error( `If virtualized scroll is enabled, visibleRows.length must be equal { rangeToIndex - rangeFromIndex }` );
            }
        }
    }

    const colGroupComponent = useMemo(() => (
        <colgroup>
            {columns.map(({ dataKey, background, visibility, border, width }) => <col key={dataKey} style={{
                width,
                background,
                visibility,
                border
            }} /> )}
        </colgroup>
    ), [ columns ]);

    const wrapperStyle = useMemo(() => ({ width, height }), [ width, height ]);

    const tableStyle = useMemo(() => ({
        tableLayout: bodyTableLayoutFixed ? "fixed" : "auto",
        width: width - currentHorizontalScrollbarOffset
    }), [ width, currentHorizontalScrollbarOffset, bodyTableLayoutFixed ]);
    
    return (
        <TableBodyWrapperComponent style={wrapperStyle} ref={ref} onScroll={onScroll}>
            <TableComponent style={tableStyle}>
                {colGroupComponent}
                <TbodyComponent>
                    {visibleRows}
                </TbodyComponent>
            </TableComponent>
        </TableBodyWrapperComponent>
    );
}), ( p1, p2 ) => areEqualBy( MEMO_PROPS, p1, p2 ) );

export default TableBody;