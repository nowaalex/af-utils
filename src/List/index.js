import React, { memo, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { css } from "emotion";

import Context from "../Context";
import VariableSizeList from "../models/VariableSizeList";
import useStore from "../utils/useStore";


import ScrollContainer from "../common/ScrollContainer";
import RowComponentDefault from "./common/Row";
import Rows from "./common/Rows";

import Scroller from "../common/Scroller";
import RowCountWarningContainerDefault from "../common/RowCountWarningContainer";


/*
    flex: 1 1 auto, assuming that table would be used full-stretch mostly
*/
const wrapperClass = css`
    min-height: 0;
    flex: 1 1 auto;

    * {
        box-sizing: border-box;
    }
`;

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
    RowComponent,
    ...props
}) => {

    const scrollContainerRef = useRef();
    const rowsContainerRef = useRef();

    const Store = useStore( VariableSizeList, dataRef );

    useEffect(() => {
        Store.merge({
            rowDataGetter: getRowData,
            rowKeyGetter: getRowKey,
            overscanRowsCount,
            estimatedRowHeight,
            totalRows: rowCount,
            rowsContainerNode: rowsContainerRef.current,
            scrollContainerNode: scrollContainerRef.current
        });
    });

    return (
        <Context.Provider value={Store}>
            { rowCount > 0 ? (
                <ScrollContainer
                    className={wrapperClass}
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
}

List.propTypes = {
    getRowData: PropTypes.func.isRequired,
    className: PropTypes.string,
    rowCount: PropTypes.number,
    getRowKey: PropTypes.func,
    estimatedRowHeight: PropTypes.number,
    getRowExtraProps: PropTypes.func,
    overscanRowsCount: PropTypes.number,
    RowComponent: PropTypes.any,

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
    RowComponent: memo( RowComponentDefault ),
    RowCountWarningContainer: RowCountWarningContainerDefault,
};

export default memo( List );