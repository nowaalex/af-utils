import React, { memo, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { css } from "emotion";

import Context from "../Context";
import VirtualTableListStore from "../models/List";
import useStore from "../utils/useStore";

import RowComponentDefault from "./common/Row";
import CellComponentDefault from "./common/Cell";
import RowCountWarningContainerDefault from "./common/RowCountWarningContainer";



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

    ...props
}) => {

    const scrollContainerRef = useRef();

    const Store = useStore( VirtualTableListStore, dataRef );

    useEffect(() => {
        Store.merge({
            rowDataGetter: getRowData,
            rowKeyGetter: getRowKey,
            overscanRowsCount,
            estimatedRowHeight,
            totalRows: rowCount,
            rowsContainerNode: scrollContainerRef.current,
            scrollContainerNode: scrollContainerRef.current
        });
    });

    return (
        <Context.Provider value={Store}>
            { rowCount > 0 ? (
                <ComponentVariant
                    className={wrapperClass}
                    scrollContainerRef={scrollContainerRef}
                    getRowExtraProps={getRowExtraProps}
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
    CellComponent: CellComponentDefault,
    RowCountWarningContainer: RowCountWarningContainerDefault,
};

export default memo( List );