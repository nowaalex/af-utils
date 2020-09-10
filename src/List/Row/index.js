import React from "react";
import PropTypes from "prop-types";
import { getRowProps } from "../../utils/extraPropsGetters";

const Row = ({ getRowData, getRowExtraProps, rowIndex }) => {

    const rowData = getRowData( rowIndex );

    return (
        <div {...getRowProps(rowData, rowIndex, rowIndex, getRowExtraProps)}>
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