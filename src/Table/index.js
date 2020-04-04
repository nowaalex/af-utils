import React, { memo, useEffect, useRef } from "react";
import PropTypes from "prop-types";

import isPositionStickySupported from "../utils/isPositionStickySupported";
import Context from "../Context";
import useStore from "../utils/useStore";

import FixedSizeTableStore from "../models/FixedSizeTable";
import VariableSizeTableStore from "../models/VariableSizeTable";

import RowComponentDefault from "./common/Row";
import CellComponentDefault from "./common/Cell";
import TotalsCellComponentDefault from "./common/TotalsCell";

import RowCountWarningContainerDefault from "../common/RowCountWarningContainer";

import NonStickyComponent from "./NonSticky";
import StickyComponent from "./Sticky";

import commonPropTypes from "../commonPropTypes";
import commonDefaultProps from "../commonDefaultProps";
import cx from "../utils/cx";

const Table = ({
    fixedSize,
    columns,
    totals,
    getRowData,
    getRowKey,
    getRowExtraProps,
    getCellExtraProps,
    rowCount,
    overscanRowsCount,
    rowCountWarningsTable,
    headless,
    RowCountWarningContainer,
    dataRef,
    useStickyIfPossible,
    className,
    ...props
}) => {

    const scrollContainerRef = useRef();
    const tbodyRef = useRef();

    const Store = useStore( fixedSize ? FixedSizeTableStore : VariableSizeTableStore, dataRef );

    useEffect(() => {
        Store.merge({
            headlessMode: headless,
            rowDataGetter: getRowData,
            rowKeyGetter: getRowKey,
            overscanRowsCount,
            totals,
            columns,
            totalRows: Math.max( rowCount, 0 ),
            rowsContainerNode: tbodyRef.current,
            scrollContainerNode: scrollContainerRef.current
        });
    });

    /*
        Only cells inside thead/tfoot can be sticky.
        If thead/tfoot are hidden - we can easily render lighter StickyComponent to avoid extra wrappers
    */
    const ComponentVariant = ( headless && !totals ) || ( useStickyIfPossible && isPositionStickySupported() ) ? StickyComponent : NonStickyComponent;

    return (
        <Context.Provider value={Store}>
            { rowCount > 0 ? (
                <ComponentVariant
                    className={cx("afvscr-table-wrapper",className)}
                    scrollContainerRef={scrollContainerRef}
                    getRowExtraProps={getRowExtraProps}
                    getCellExtraProps={getCellExtraProps}
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
    ...commonPropTypes,
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            // unique key for column
            dataKey: PropTypes.string.isRequired,

            // If rowData is available, cellData goes through flow, where each fn is optional: render(format((getCellData(rowData,rowIndex))),rowData)
            // If not, it goes through flow: getEmptyCellData(rowIndex, column).
            getCellData: PropTypes.func,
            getEmptyCellData: PropTypes.func,
            format: PropTypes.func,
            formatTotal: PropTypes.func,

            visibility: PropTypes.oneOf([ "visible", "hidden" ]),
            sort: PropTypes.oneOf([ "locale", "numeric" ]),

            // column props, affecting colgroup > col tags
            background: PropTypes.string,
            border: PropTypes.string,
            width: PropTypes.oneOfType([ PropTypes.number, PropTypes.string ]),
            CellComponent: PropTypes.any,
            getCellExtraProps: PropTypes.func
        })
    ).isRequired,

    getCellExtraProps: PropTypes.func,

    totals: PropTypes.objectOf(
        // array may contain: "sum", "average", "count", "max", "min"
        PropTypes.array
    ),
    
    useStickyIfPossible: PropTypes.bool,
    headless: PropTypes.bool,

    HeaderRowComponent: PropTypes.any,
    CellComponent: PropTypes.any,
    TotalsCellComponent: PropTypes.any,

    RowCountWarningContainer: PropTypes.any,
    rowCountWarningsTable: PropTypes.object,

    // Determines, if table-layout: fixed is applied to main table
    fixedLayout: PropTypes.bool
};

Table.defaultProps = {
    ...commonDefaultProps,
    fixedLayout: false,
    headless: false,

    //    For 90% non-reactive solutions, which only provide new getRowData when data is changed, memo is ok.
    //    If RowComponent should be wrapped my mobx observer - non-memo version should be imported.
    //    memo(observer(RowComponentDefault)) will do the trick.
    
    RowComponent: memo( RowComponentDefault ),
    CellComponent: CellComponentDefault,
    TotalsCellComponent: TotalsCellComponentDefault,
    RowCountWarningContainer: RowCountWarningContainerDefault,
};

export default memo( Table );