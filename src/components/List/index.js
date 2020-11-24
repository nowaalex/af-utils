import { memo, useState } from "react";
import PropTypes from "prop-types";

import Context from "Context";
import useModel from "hooks/useModel";

import VariableHeightsStore from "models/VariableSizeList";
import FixedHeightsStore from "models/FixedSizeList";

import ScrollContainer from "../common/ScrollContainer";
import Scroller from "../common/Scroller";
import commonPropTypes from "../common/propTypes";
import commonDefaultProps from "../common/defaultProps";

import Rows from "./Rows";

const List = ({
    fixed,
    children,
    estimatedRowHeight,
    rowsQuantity,
    overscanRowsCount,
    dataRef,
    ...props
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
            <ScrollContainer {...props}>
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
     * @returns {any} one row element child. Fragments are not supported.
     */
    children: PropTypes.func.isRequired
}

List.defaultProps = commonDefaultProps;

export default memo( List );