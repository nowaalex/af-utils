import React, { memo, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { css } from "emotion";

import isPositionStickySupported from "../utils/isPositionStickySupported";
import Context from "../Context";
import VirtualTableDataStore from "../models/Table";

import RowComponentDefault from "./common/Row";
import CellComponentDefault from "./common/Cell";
import RowCountWarningContainerDefault from "./common/RowCountWarningContainer";

import NonStickyComponent from "./NonSticky";
import StickyComponent from "./Sticky";


/*
    flex: 1 1 auto, assuming that table would be used full-stretch mostly
*/
const wrapperClass = css`
    min-height: 0;
    flex: 1 1 auto;

    td, th {
        overflow: hidden;
        text-overflow: ellipsis;
    }

    thead, tfoot {
        white-space: nowrap;
    }

    * {
        box-sizing: border-box;
    }
`;

/*
    dataRef is to call Data methods from outside( Data.scrollTo(), etc. ).
    As it is not dom-related, I decided to avoid forwardRef
*/
const Table = ({
    columns,
    totals,
    getRowData,
    getRowKey,
    getRowExtraProps,
    rowCount,
    estimatedRowHeight,
    overscanRowsCount,
    rowCountWarningsTable,
    headless,
    RowCountWarningContainer,
    dataRef,
    useStickyIfPossible,

    ...props
}) => {

    const scrollContainerRef = useRef();
    const tbodyRef = useRef();
    const isMountedRef = useRef();
    const finalDataRef = useRef();

    if( !finalDataRef.current ){
        finalDataRef.current = new VirtualTableDataStore({
            overscanRowsCount,
            columns,
            totals,
            totalRows: rowCount,
            rowDataGetter: getRowData,
            rowKeyGetter: getRowKey,
            estimatedRowHeight: estimatedRowHeight,
            headlessMode: headless,
            getRowsContainerNode: () => tbodyRef.current,
            getScrollContainerNode: () => scrollContainerRef.current
        });
    }

    useEffect(() => {
        if( dataRef ){
            dataRef.current = finalDataRef.current;
        }
        if( isMountedRef.current ){
            finalDataRef.current
                .setHeadlessMode( headless )
                .setRowDataGetter( getRowData )
                .setRowKeyGetter( getRowKey )
                .setOverscanRowsCount( overscanRowsCount )
                .setTotals( totals )
                .setColumns( columns )
                .setTotalRows( rowCount )
                .setEstimatedRowHeight( estimatedRowHeight );
        }
    });

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            finalDataRef.current.destructor();
        };
    }, []);

    /*
        Only cells inside thead/tfoot can be sticky.
        If thead/tfoot are hidden - we can easily render lighter StickyComponent to avoid extra wrappers
    */
    const ComponentVariant = ( headless && !totals ) || ( useStickyIfPossible && isPositionStickySupported() ) ? StickyComponent : NonStickyComponent;

    return (
        <Context.Provider value={finalDataRef.current}>
            { rowCount > 0 ? (
                <ComponentVariant
                    className={wrapperClass}
                    scrollContainerRef={scrollContainerRef}
                    tbodyRef={tbodyRef}
                    {...props}
                />
            ) : rowCountWarningsTable ? (
                <RowCountWarningContainer>
                    {rowCountWarningsTable[rowCount]}
                </RowCountWarningContainer>
            ) : null }
        </Context.Provider>
    );
}

Table.propTypes = {
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            /* unique key for column */
            dataKey: PropTypes.string.isRequired,

            /* 
                If rowData is available, cellData goes through flow, where each fn is optional: transformCellData(getCellData(rowData,rowIndex),rowData, column, rowIndex)
                If not, it goes through flow: getEmptyCellData(rowIndex, column).
            */
            getCellData: PropTypes.func,
            getEmptyCellData: PropTypes.func,
            transformCellData: PropTypes.func,

            visibility: PropTypes.oneOf([ "visible", "hidden" ]),
            sort: PropTypes.oneOf([ "locale", "numeric" ]),

            /*
                column props, affecting colgroup > col tags
            */
            background: PropTypes.string,
            border: PropTypes.string,
            width: PropTypes.oneOfType([ PropTypes.number, PropTypes.string ])
        })
    ).isRequired,
    getRowData: PropTypes.func.isRequired,

    totals: PropTypes.objectOf(
        /* array may contain: "sum", "average", "count". */
        PropTypes.array
    ),
    
    useStickyIfPossible: PropTypes.bool,
    headless: PropTypes.bool,
    className: PropTypes.string,
    rowCount: PropTypes.number,
    getRowKey: PropTypes.func,
    estimatedRowHeight: PropTypes.number,
    getRowExtraProps: PropTypes.func,
    overscanRowsCount: PropTypes.number,

    HeaderRowComponent: PropTypes.any,
    RowComponent: PropTypes.any,
    CellComponent: PropTypes.any,

    RowCountWarningContainer: PropTypes.any,
    rowCountWarningsTable: PropTypes.object,

    /* Determines, if table-layout: fixed is applied to main table */
    fixedLayout: PropTypes.bool
};

Table.defaultProps = {
    rowCount: 0,
    estimatedRowHeight: 20,
    overscanRowsCount: 4,
    fixedLayout: false,
    headless: false,

    /*
        For 90% non-reactive solutions, which only provide new getRowData when data is changed, memo is ok.
        If RowComponent should be wrapped my mobx observer - non-memo version should be imported.
        memo(observer(RowComponentDefault)) will do the trick.
    */
    RowComponent: memo( RowComponentDefault ),
    CellComponent: CellComponentDefault,
    RowCountWarningContainer: RowCountWarningContainerDefault,
};

export default memo( Table );