import React, { memo, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { css } from "emotion";

import Context from "../Context";
import VirtualListDataStore from "../models/List";
import RowCountWarningContainerDefault from "./common/RowCountWarningContainer";



/*
    flex: 1 1 auto, assuming that list would be used full-stretch mostly
*/
const wrapperClass = css`
    min-height: 0;
    flex: 1 1 auto;

    td, th {
        overflow: hidden;
        text-overflow: ellipsis;
    }

    * {
        box-sizing: border-box;
    }
`;

/*
    dataRef is to call Data methods from outside( Data.scrollTo(), etc. ).
    As it is not dom-related, I decided to avoid forwardRef
*/
const List = ({
    getRowData,
    getRowKey,
    getRowExtraProps,
    rowCount,
    estimatedRowHeight,
    overscanRowsCount,
    rowCountWarningsTable,
    RowCountWarningContainer,
    dataRef,

    ...props
}) => {

    const scrollContainerRef = useRef();
    const isMountedRef = useRef();
    const finalDataRef = useRef();

    if( !finalDataRef.current ){
        finalDataRef.current = new VirtualListDataStore({
            overscanRowsCount,
            totalRows: rowCount,
            estimatedRowHeight: estimatedRowHeight,
            getRowsContainerNode: () => scrollContainerRef.current,
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

    return (
        <Context.Provider value={finalDataRef.current}>
            { rowCount > 0 ? (
                <ComponentVariant
                    className={wrapperClass}
                    scrollContainerRef={scrollContainerRef}
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

List.propTypes = {
    getItemData: PropTypes.func.isRequired,
    className: PropTypes.string,
    rowCount: PropTypes.number,
    getItemKey: PropTypes.func,
    estimatedRowHeight: PropTypes.number,
    getRowExtraProps: PropTypes.func,
    overscanRowsCount: PropTypes.number,

    ItemComponent: PropTypes.any,

    RowCountWarningContainer: PropTypes.any,
    rowCountWarningsTable: PropTypes.object
};

List.defaultProps = {
    rowCount: 0,
    estimatedRowHeight: 20,
    overscanRowsCount: 4,

    /*
        For 90% non-reactive solutions, which only provide new getRowData when data is changed, memo is ok.
        If RowComponent should be wrapped my mobx observer - non-memo version should be imported.
        memo(observer(RowComponentDefault)) will do the trick.
    */
    ItemComponent: "div",
    RowCountWarningContainer: RowCountWarningContainerDefault,
};

export default memo( List );