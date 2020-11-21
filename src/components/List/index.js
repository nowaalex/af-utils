import { memo, useState } from "react";
import PropTypes from "prop-types";

import Context from "Context";
import useModel from "hooks/useModel";

import VariableHeightsStore from "models/VariableSizeList";
import FixedHeightsStore from "models/FixedSizeList";

import ScrollContainer from "../common/ScrollContainer";
import Scroller from "../common/Scroller";
import commonPropTypes from "../common/propTypes";

import Rows from "./Rows";

const List = ({
    fixed,
    children,
    estimatedRowHeight,
    rowsQuantity,
    overscanRowsCount,
    dataRef,
    className
}) => {

    const [ rowsContainerNode, rowsContainerRef ] = useState();

    const Store = useModel(
        fixed ? FixedHeightsStore : VariableHeightsStore,
        dataRef,
        estimatedRowHeight,
        overscanRowsCount,
        rowsQuantity,
        rowsContainerNode
    );

    return (
        <Context.Provider value={Store}>
            <ScrollContainer className={className}>
                <Scroller as="div" />
                <div ref={rowsContainerRef}>
                    <Rows renderRow={children} /> 
                </div>
            </ScrollContainer>
        </Context.Provider>
    );
};

List.propTypes = {
    ...commonPropTypes,

    /**
     * @param {number} rowIndex
     * @returns {any} row element children
     */
    children: PropTypes.func.isRequired
}

List.defaultProps = {
    fixed: false,
    estimatedRowHeight: 20,
    overscanRowsCount: 4
};

export default memo( List );