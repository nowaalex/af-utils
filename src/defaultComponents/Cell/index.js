import React from "react";
import PropTypes from "prop-types";

// &nbnsp;
const DEFAULT_EMPTY_CELL_CONTENT = "\u00A0";

const Cell = ({ rowData, rowIndex, column }) => {
    const { transformCellData, getEmptyCellData, dataKey } = column;

    let cellData = rowData && rowData[ dataKey ];
    
    if( cellData === undefined || cellData === "" ){
        cellData = getEmptyCellData ? getEmptyCellData( rowIndex, column ) : DEFAULT_EMPTY_CELL_CONTENT;
    }
    else if( transformCellData ){
        cellData = transformCellData( cellData, rowData, column, rowIndex );
    }

    return (
        <td key={dataKey}>
            {cellData}
        </td>
    );
};

Cell.propTypes = {
    rowIndex: PropTypes.number.isRequired,
    column: PropTypes.object.isRequired,
    rowData: PropTypes.object
};

export default Cell;