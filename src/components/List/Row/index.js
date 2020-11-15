import React from "react";
import PropTypes from "prop-types";

const Row = ({ getRowData, getRowExtraProps, rowIndex }) => {

    const rowData = getRowData( rowIndex );

    return (
        <div {...( getRowExtraProps && getRowExtraProps(rowData, rowIndex))} aria-rowindex={rowIndex+1}>
            {rowData}
        </div>
    );
};

Row.propTypes = {
    getRowData: PropTypes.func.isRequired,
    rowIndex: PropTypes.number.isRequired,
    getRowExtraProps: PropTypes.func
};

export default Row;