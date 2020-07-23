import React, { useLayoutEffect, memo } from "react";
import PropTypes from "prop-types";

import isPositionStickySupported from "../utils/isPositionStickySupported";
import Context from "../Context";
import useStore from "../utils/useStore";

import FixedSizeTableStore from "../models/FixedSizeTable";
import VariableSizeTableStore from "../models/VariableSizeTable";

import RowComponentDefault from "./common/Row";
import CellComponentDefault from "./common/Cell";
import TotalsCellComponentDefault from "./common/TotalsCell";

import NonStickyComponent from "./NonSticky";
import StickyComponent from "./Sticky";

import commonPropTypes from "../commonPropTypes";
import commonDefaultProps from "../commonDefaultProps";
import cx from "../utils/cx";

import castArray from "lodash/castArray";

const Table = ({
    fixedSize,
    estimatedRowHeight,
    columns,
    totals,
    getRowData,
    getCellData,
    getRowKey,
    getRowExtraProps,
    getCellExtraProps,
    rows,
    overscanRowsCount,
    headless,
    dataRef,
    nonSticky,
    className,
    initialGrouping,
    initialExpandedGroups,
    ...props
}) => {

    const [ Store, scrollContainerRef, tbodyRef ] = useStore( fixedSize ? FixedSizeTableStore : VariableSizeTableStore, dataRef, {
        headlessMode: headless,
        getRowData,
        getCellData,
        getRowKey,
        overscanRowsCount,
        estimatedRowHeight,
        totals,
        columns,
        rows
    });

    useLayoutEffect(() => {
        if( initialGrouping ){
            Store.Rows.aggregators.addGrouping( ...castArray( initialGrouping ) );
            if( initialExpandedGroups ){
                Store.Rows.resetExpandedState( initialExpandedGroups )
            }
        }
    }, [ Store ]);

    /*
        Only cells inside thead/tfoot can be sticky.
        If thead/tfoot are hidden - we can easily render lighter StickyComponent to avoid extra wrappers
    */
    const ComponentVariant = ( headless && !totals ) || ( !nonSticky && isPositionStickySupported() ) ? StickyComponent : NonStickyComponent;

    return (
        <Context.Provider value={Store}>
            <ComponentVariant
                className={cx("afvscr-table-wrapper",className)}
                scrollContainerRef={scrollContainerRef}
                getRowExtraProps={getRowExtraProps}
                getCellExtraProps={getCellExtraProps}
                tbodyRef={tbodyRef}
                {...props}
            />
        </Context.Provider>
    );
}

Table.propTypes = {
    ...commonPropTypes,
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            // unique key for column
            dataKey: PropTypes.string.isRequired,

            // for details see CellComponent implementation
            getCellData: PropTypes.func,
            getEmptyCellData: PropTypes.func,
            format: PropTypes.func,
            render: PropTypes.func,
            formatTotal: PropTypes.func,

            visibility: PropTypes.oneOf([ "visible", "hidden" ]),
            sort: PropTypes.oneOf([ "locale", "numeric" ]),

            // column props, affecting colgroup > col tags
            background: PropTypes.string,
            border: PropTypes.string,
            width: PropTypes.oneOfType([ PropTypes.number, PropTypes.string ]),
            CellComponent: PropTypes.elementType,
            getCellExtraProps: PropTypes.func
        })
    ).isRequired,

    getCellExtraProps: PropTypes.func,

    totals: PropTypes.objectOf(
        // array may contain: "sum", "average", "count", "max", "min"
        PropTypes.array
    ),
    
    nonSticky: PropTypes.bool,
    headless: PropTypes.bool,

    HeaderRowComponent: PropTypes.elementType,
    CellComponent: PropTypes.elementType,
    getCellData: PropTypes.func,
    TotalsCellComponent: PropTypes.elementType,

    initialGrouping: PropTypes.oneOfType([ PropTypes.string, PropTypes.array ]),
    initialExpandedGroups: PropTypes.object
};

Table.defaultProps = {
    ...commonDefaultProps,
    headless: false,

    //    For 90% non-reactive solutions, which only provide new getRowData when data is changed, memo is ok.
    //    If RowComponent should be wrapped my mobx observer - non-memo version should be imported.
    //    memo(observer(RowComponentDefault)) will do the trick.
    
    RowComponent: memo( RowComponentDefault ),
    CellComponent: CellComponentDefault,
    getCellData: ( rowData, rowIndex, dataKey ) => rowData[ dataKey ],
    TotalsCellComponent: TotalsCellComponentDefault
};

export default memo( Table );