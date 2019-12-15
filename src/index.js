import React, { useEffect, memo, useCallback, useMemo, useRef, useState, useReducer } from "react";
import TableBody from "./TableBody";
import TableHead from "./TableHead";
import styled from "@emotion/styled";
import getScrollBarWidth from "./utils/getScrollbarWidth";
import useThrottledCallback from "./utils/useThrottledCallback";
import areArraysEqual from "./utils/areArraysEqual";

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

export const mapCellsDefault = ( columns, rowData, CellComponent, getCellData ) => columns.map(( column, columnIndex, columns ) => {
    const cellData = getCellData( rowData, column, columnIndex, columns );
    const transformCellData = column.transformCellData;
    const FinalCellComponent = column.CellComponent || CellComponent;
    return (
        <FinalCellComponent key={column.dataKey}>
            {transformCellData?transformCellData(cellData,rowData,columnIndex):cellData}
        </FinalCellComponent>
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
}

export const getCellDataDefault = ( rowData, column ) => rowData[ column.dataKey ];

export const getRowExtraPropsDefault = () => undefined;

export const getHeaderCellDataDefault = column => column.label;

export const tbodyColumnWidthsReducer = ( curWidths, newWidths ) => areArraysEqual( curWidths, newWidths ) ? curWidths : newWidths;

export const HeaderCellComponentDefault = styled.th`
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Table = memo(({
    height,
    width,
    style,
    rowCount,
    columns,
    getRowData,

    /* must provide only if virtualizedScroll = true */
    headerHeight,
    rowHeight,
    
    getRowKey,
    getVisibleRows = getVisibleRowsDefault,
    rowsChangeHash,
    getRowExtraProps = getRowExtraPropsDefault,
    mapCells = mapCellsDefault,
    getCellData = getCellDataDefault,
    getHeaderCellData = getHeaderCellDataDefault,
    virtualizedScroll = false,
    overscanRowsCount = 5,
    measureCellWidthThrottleInterval = 1000,
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
    HeaderCellComponent = HeaderCellComponentDefault,

    EmptyDataRowComponent = EmptyDataRowComponentDefault,

    ...props
}) => {
    const tableBodyRef = useRef();

    const [ bodyScrollTop, setBodyScrollTop ] = useState( 0 );
    const [ bodyScrollLeft, setBodyScrollLeft ] = useState( 0 );
    const [ cssDimensionsDifference, setCssDimensionsDifference ] = useState( 0 ); 

    const [ currentHorizontalScrollbarOffset, setHorizontalScrollBarOffset ] = useState( 0 );

    const [ tbodyColumnWidths, setTdWidths ] = useReducer(
        tbodyColumnWidthsReducer,
        columns,
        columns => columns.map( c => c.width || "auto" )
    );

    useEffect(() => {
        const { scrollHeight, clientHeight } = tableBodyRef.current;
        setHorizontalScrollBarOffset( scrollHeight > clientHeight ? getScrollBarWidth() : 0 );
    }, [ rowHeight, rowCount, height, headerHeight ]);

    const bodyScrollHandler = useCallback( e => {
        const { scrollTop, scrollLeft } = e.target;
        setBodyScrollLeft( scrollLeft );
        setBodyScrollTop( scrollTop );
    }, []);

    const measureCellWidthsThrottled = useThrottledCallback(() => {
        const tbody = tableBodyRef.current.getElementsByTagName( "tbody" )[ 0 ];
        if( !tbody ){
            throw new Error( "cannot find tbody element inside TableBody" );
        }
        for( let tr of tbody.children ){
            if( tr.children.length === columns.length ){
                /* we must select "correct" rows without colspans, etc. */
                const pixelWidths = [];
                for( let td of tr.children ){
                    pixelWidths.push( td.offsetWidth );
                }
                setTdWidths( pixelWidths );
                break;
            }
        }
    }, measureCellWidthThrottleInterval, [ measureCellWidthThrottleInterval, columns.length ]);

    useEffect( measureCellWidthsThrottled );

    /*useEffect(() => {
        const bodyTable = tableBodyRef.current.getElementsByTagName( "table" )[ 0 ];
        const { borderSpacing } = getComputedStyle( bodyTable );
        let [ horizontalSpacing, verticalSpacing ] 
    }, []);*/

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
                height={headerHeight}
                width={width-currentHorizontalScrollbarOffset}
                TableHeaderWrapperComponent={TableHeaderWrapperComponent}
                HeaderRowComponent={HeaderRowComponent}
                HeaderCellComponent={HeaderCellComponent}
                virtualizedScroll={virtualizedScroll}
                VirtualizedTableCellHeightControllerComponent={VirtualizedTableCellHeightControllerComponent}
                TheadComponent={TheadComponent}
                TableComponent={TableComponent}
                columns={columns}
                getHeaderCellData={getHeaderCellData}
            />
            <TableBody
                ref={tableBodyRef}
                height={headerHeight ? height - headerHeight : undefined}
                width={width}
                onScroll={bodyScrollHandler}
                bodyTableLayoutFixed={bodyTableLayoutFixed}
                virtualizedScroll={virtualizedScroll}
                RowComponent={RowComponent}
                CellComponent={CellComponent}
                VirtualizedTableCellHeightControllerComponent={VirtualizedTableCellHeightControllerComponent}
                TbodyComponent={TbodyComponent}
                TableComponent={TableComponent}
                TableBodyWrapperComponent={TableBodyWrapperComponent}
                EmptyDataRowComponent={EmptyDataRowComponent}
                currentHorizontalScrollbarOffset={currentHorizontalScrollbarOffset}
                rowsChangeHash={rowsChangeHash}
                rowHeight={rowHeight}
                getVisibleRows={getVisibleRows}
                getRowData={getRowData}
                getRowKey={getRowKey}
                getRowExtraProps={getRowExtraProps}
                columns={columns}
                rowCount={rowCount}
                mapCells={mapCells}
                getCellData={getCellData}
            />
        </WrapperComponent>
    );
})

export default Table;