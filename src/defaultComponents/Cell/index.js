import React from "react";
import PropTypes from "prop-types";

const Cell = ({ rowData, columnIndex, column }) => {
    const { transformCellData, dataKey } = column;
    const cellData = rowData && rowData[ dataKey ];
    return (
        <td key={dataKey}>
            {rowData && transformCellData ? transformCellData( cellData, rowData, columnIndex ) : cellData}
        </td>
    );
};

Cell.propTypes = {
    columnIndex: PropTypes.number.isRequired,
    column: PropTypes.object.isRequired,
    rowData: PropTypes.object
};

export default Cell;