import React, { memo, useEffect, useRef } from "react";
import PropTypes from "prop-types";

import Context from "../Context";
import useStore from "../utils/useStore";

import VariableSizeListStore from "../models/VariableSizeList";
import FixedSizeListStore from "../models/FixedSizeList";

import ScrollContainer from "../common/ScrollContainer";
import RowComponentDefault from "./common/Row";
import Rows from "./common/Rows";

import Scroller from "../common/Scroller";
import RowCountWarningContainerDefault from "../common/RowCountWarningContainer";

import commonPropTypes from "../commonPropTypes";
import commonDefaultProps from "../commonDefaultProps";

import cx from "../utils/cx";

const List = ({
    fixedSize,
    getRowData,
    getRowKey,
    getRowExtraProps,
    rowCount,
    overscanRowsCount,
    rowCountWarningsTable,
    RowCountWarningContainer,
    RowComponent = RowComponentDefault,
    dataRef,
    className,
    ...props
}) => {

    const scrollContainerRef = useRef();
    const rowsContainerRef = useRef();

    const Store = useStore( fixedSize ? FixedSizeListStore : VariableSizeListStore, dataRef );

    useEffect(() => {
        Store.merge({
            rowDataGetter: getRowData,
            rowKeyGetter: getRowKey,
            overscanRowsCount,
            totalRows: rowCount,
            rowsContainerNode: rowsContainerRef.current,
            scrollContainerNode: scrollContainerRef.current
        });
    });

    return (
        <Context.Provider value={Store}>
            { rowCount > 0 ? (
                <ScrollContainer
                    className={cx("afvscr-list-wrapper",className)}
                    ref={scrollContainerRef}
                    {...props}
                >
                    <Scroller Component="div" />
                    <div ref={rowsContainerRef}>
                        <Rows RowComponent={RowComponent} getRowExtraProps={getRowExtraProps} />
                    </div>
                </ScrollContainer>
            ) : rowCountWarningsTable ? (
                <RowCountWarningContainer>
                    {rowCountWarningsTable[rowCount]}
                </RowCountWarningContainer>
            ) : null }
        </Context.Provider>
    );
};

List.propTypes = {
    ...commonPropTypes,
    RowCountWarningContainer: PropTypes.any,
    rowCountWarningsTable: PropTypes.object
};

List.defaultProps = {
    ...commonDefaultProps,

    
    /*
        For 90% non-reactive solutions, which only provide new getRowData when data is changed, memo is ok.
        If RowComponent should be wrapped my mobx observer - non-memo version should be imported.
        memo(observer(RowComponentDefault)) will do the trick.
    */
    
    RowComponent: memo( RowComponentDefault ),
    RowCountWarningContainer: RowCountWarningContainerDefault,
};

export default memo( List );