import { memo, useState } from "react";
import PropTypes from "prop-types";

import Context from "Context";
import useModel from "hooks/useModel";

import VariableHeightsStore from "models/VariableSizeList";
import FixedHeightsStore from "models/FixedSizeList";

import ScrollContainer from "../common/ScrollContainer";
import commonDefaultProps from "../common/defaultProps";

import Rows from "./Rows";

const List = ({
    fixed,
    children,
    estimatedRowHeight,
    rowsQuantity,
    overscanRowsCount,
    dataRef,
    onRangeEndMove,
    ...props
}) => {

    const [ rowsContainerNode, rowsContainerRef ] = useState();

    const Store = useModel(
        fixed ? FixedHeightsStore : VariableHeightsStore,
        dataRef,
        estimatedRowHeight,
        overscanRowsCount,
        rowsQuantity,
        rowsContainerNode,
        onRangeEndMove
    );

    return (
        <Context.Provider value={Store}>
            <ScrollContainer {...props}>
                <Rows dataRef={rowsContainerRef} renderRow={children} /> 
            </ScrollContainer>
        </Context.Provider>
    );
};

List.propTypes = {
    rowsQuantity: PropTypes.number.isRequired,
    className: PropTypes.string,
    fixed: PropTypes.bool,
    overscanRowsCount: PropTypes.number,
    estimatedRowHeight: PropTypes.number,
    onRangeEndMove: PropTypes.func,

    /**
     * @param {number} rowIndex
     * @returns {any} one row element child. Fragments are not supported.
     */
    children: PropTypes.func.isRequired
}

List.defaultProps = commonDefaultProps;

export default memo( List );