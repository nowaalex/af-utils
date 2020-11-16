import { memo } from "react";

import Context from "Context";
import useModel from "hooks/useModel";

import VariableHeightsStore from "models/lists/VariableHeight";
import FixedHeightsStore from "models/lists/FixedHeight";

import ScrollContainer from "../common/ScrollContainer";
import Scroller from "../common/Scroller";
import commonPropTypes from "../common/propTypes";

import RowComponentDefault from "./Row";
import Rows from "./Rows";

const List = ({
    fixed,
    getRowData,
    getRowKey,
    getRowExtraProps,
    estimatedRowHeight,
    rowsQuantity,
    overscanRowsCount,
    RowComponent,
    dataRef,
    className,
    ...props
}) => {

    const [ Store, rowsContainerRef ] = useModel( fixed ? FixedHeightsStore : VariableHeightsStore, dataRef, {
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

List.propTypes = commonPropTypes;

List.defaultProps = {
    fixed: false,
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