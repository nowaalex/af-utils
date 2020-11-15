import { memo } from "react";
import PropTypes from "prop-types";

import Context from "Context";
import useModel from "hooks/useModel";

import FixedSizeListStore from "models/virtualization/DifferentHeight";

import ScrollContainer from "../common/ScrollContainer";
import Scroller from "../common/Scroller";

import RowComponentDefault from "./Row";
import Rows from "./Rows";

const List = ({
    getRowData,
    getRowKey,
    getRowExtraProps,
    estimatedRowHeight,
    rowsQuantity,
    overscanRowsCount,
    RowComponent = RowComponentDefault,
    dataRef,
    className,
    ...props
}) => {

    const [ Store, rowsContainerRef ] = useModel( FixedSizeListStore, dataRef, {
        getRowData,
        getRowKey,
        overscanRowsCount,
        estimatedRowHeight,
        rowsQuantity
    });

    return (
        <Context.Provider value={Store}>
            <ScrollContainer className={className} {...props}>
                <Scroller as={<div />} />
                <div ref={rowsContainerRef}>
                    <Rows RowComponent={RowComponent} getRowExtraProps={getRowExtraProps} />
                </div>
            </ScrollContainer>
        </Context.Provider>
    );
};

List.defaultProps = {
    estimatedRowHeight: 20,
    overscanRowsCount: 4,
    /*
        For 90% non-reactive solutions, which only provide new getRowData when data is changed, memo is ok.
        If RowComponent should be wrapped my mobx observer - non-memo version should be imported.
        memo(observer(RowComponentDefault)) will do the trick.
    */
    
    RowComponent: memo( RowComponentDefault )
};

export default memo( List );