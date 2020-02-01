import React, { useEffect, memo, useMemo, useState } from "react";
import styled from "@emotion/styled";
import useResizeObserver from "use-resize-observer";
import TableBody from "./TableBody";
import TableHead from "./TableHead";
import getScrollBarWidth from "./utils/getScrollbarWidth";
import useSyncedColumnWidths from "./hooks/useSyncedColumnWidths";
import useScrollSync from "./hooks/useScrollSync";

const WrapperComponent = styled.div`
    display: flex;
    flex-flow: column nowrap;
    overflow: hidden;
`;

export const TableBodyWrapperComponentDefault = styled.div`
    overflow: auto;
    min-height: 0;
    flex: 1 1 auto;
`;

export const TableHeaderWrapperComponentDefault = styled.div`
    flex: 0 0 auto;
    overflow: hidden;
`;

const EmptyDataRowComponentDefault = memo(({ RowComponent, CellComponent, columns }) => (
    <RowComponent>
        <CellComponent colSpan={columns.length}>&mdash;</CellComponent>
    </RowComponent>
));

export const mapCellsDefault = ( columns, rowData, DefaultCellComponent, getCellData ) => columns.map(( column, columnIndex, curColumns ) => {
    const cellData = getCellData( rowData, column, columnIndex, curColumns );
    const { transformCellData, dataKey, CellComponent = DefaultCellComponent } = column;
    return (
        <CellComponent key={dataKey}>
            {transformCellData?transformCellData(cellData,rowData,columnIndex):cellData}
        </CellComponent>
    );
});

export const getVisibleRowsDefault = (
    rangeFrom,
    rangeTo,
    columns,
    getRowData,
    getRowKey,
    getRowExtraProps,
    RowComponent,
    mapCells,
    getCellData,
    CellComponent,
    EmptyDataRowComponent
) => {
    const result = [];
    for( let j = rangeFrom, rowData, rowKey; j < rangeTo; j++ ){
        rowData = getRowData( j );
        rowKey = getRowKey ? getRowKey( j ) : j;
        result.push( rowData ? (
            <RowComponent key={rowKey} {...getRowExtraProps( rowData, j )}>
                {mapCells(columns,rowData,CellComponent,getCellData)}
            </RowComponent>
        ) : (
            <EmptyDataRowComponent
                key={rowKey}
                CellComponent={CellComponent}
                RowComponent={RowComponent}
                rowIndex={j}
                columns={columns}
            />
        ));
    }
    return result;
};

export const getCellDataDefault = ( rowData, column ) => rowData[ column.dataKey ];

export const getRowExtraPropsDefault = () => undefined;

export const getHeaderCellDataDefault = column => column.label;

const Table = memo(({
    height,
    width,
    style,
    rowCount,
    columns,
    getRowData,
    getRowKey,
    rowsChangeHash,
    variableRowHeights = false,
    approximateRowHeight = 60,
    getVisibleRows = getVisibleRowsDefault,
    getRowExtraProps = getRowExtraPropsDefault,
    mapCells = mapCellsDefault,
    getCellData = getCellDataDefault,
    getHeaderCellData = getHeaderCellDataDefault,
    overscanRowsCount = 5,
    bodyTableLayoutFixed = false,

    /* height cannot be set on tr. so we must provide a div inside td to give height to it. */
    VirtualizedTableCellHeightControllerComponent = "div",
    TableComponent = "table",
    TableHeaderWrapperComponent = TableHeaderWrapperComponentDefault,
    TableBodyWrapperComponent = TableBodyWrapperComponentDefault,
    TbodyComponent = "tbody",
    TheadComponent = "thead",
    RowComponent = "tr",
    CellComponent = "td",
    HeaderRowComponent = "tr",
    HeaderCellComponent = "th",

    EmptyDataRowComponent = EmptyDataRowComponentDefault,

    ...props
}) => {
    const { ref: tableBodyRef, height: tbodyHeight = 1 } = useResizeObserver();

    const { bodyScrollLeft, startIndex, endIndex, bodyScrollTop, bodyScrollHandler } = useScrollSync( tableBodyRef, tbodyHeight, approximateRowHeight, overscanRowsCount );
    
    const [ cssDimensionsDifference, setCssDimensionsDifference ] = useState( 0 ); 

    const [ currentHorizontalScrollbarOffset, setHorizontalScrollBarOffset ] = useState( 0 );


    const tbodyColumnWidths = useSyncedColumnWidths( tableBodyRef, columns );


    useEffect(() => {
        const { scrollHeight, clientHeight } = tableBodyRef.current;
        setHorizontalScrollBarOffset( scrollHeight > clientHeight ? getScrollBarWidth() : 0 );
    }, [ rowCount, height ]);

    /* useEffect(() => {
        const bodyTable = tableBodyRef.current.getElementsByTagName( "table" )[ 0 ];
        const { borderSpacing } = getComputedStyle( bodyTable );
        let [ horizontalSpacing, verticalSpacing ] 
    }, []); */

    const wrapperStyle = useMemo(() => ({
        ...style,
        width,
        height
    }), [ width, height, style ]);

    return (
        <WrapperComponent {...props} style={wrapperStyle}>
            <TableHead
                bodyScrollLeft={bodyScrollLeft}
                tbodyColumnWidths={tbodyColumnWidths}
                width={width-currentHorizontalScrollbarOffset}
                TableHeaderWrapperComponent={TableHeaderWrapperComponent}
                HeaderRowComponent={HeaderRowComponent}
                HeaderCellComponent={HeaderCellComponent}
                TheadComponent={TheadComponent}
                TableComponent={TableComponent}
                columns={columns}
                getHeaderCellData={getHeaderCellData}
            />
            <TableBody
                ref={tableBodyRef}
                height={tbodyHeight}
                width={width}
                onScroll={bodyScrollHandler}
                bodyTableLayoutFixed={bodyTableLayoutFixed}
                RowComponent={RowComponent}
                CellComponent={CellComponent}
                VirtualizedTableCellHeightControllerComponent={VirtualizedTableCellHeightControllerComponent}
                TbodyComponent={TbodyComponent}
                TableComponent={TableComponent}
                TableBodyWrapperComponent={TableBodyWrapperComponent}
                EmptyDataRowComponent={EmptyDataRowComponent}
                currentHorizontalScrollbarOffset={currentHorizontalScrollbarOffset}
                rowsChangeHash={rowsChangeHash}
                getVisibleRows={getVisibleRows}
                getRowData={getRowData}
                getRowKey={getRowKey}
                getRowExtraProps={getRowExtraProps}
                columns={columns}
                startIndex={startIndex}
                endIndex={endIndex}
                rowCount={rowCount}
                mapCells={mapCells}
                getCellData={getCellData}
            />
        </WrapperComponent>
    );
});

export default Table;