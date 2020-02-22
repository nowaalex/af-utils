import React from "react";
import PropTypes from "prop-types";

const Row = ({ columns, CellComponent, getRowData, getRowExtraProps, rowDataIndex, rowIndex }) => {

    const rowData = getRowData( rowDataIndex );
    const extraProps = getRowExtraProps && getRowExtraProps( rowData, rowDataIndex );

    return (
        <tr {...extraProps} aria-rowindex={rowIndex}>
            {columns.map( column => column.visibility !== "hidden" ? (
                <CellComponent
                    key={column.dataKey}
                    rowData={rowData}
                    rowIndex={rowIndex}
                    column={column}
                />
            ) : null )}
        </tr>
    );
};

Row.propTypes = {
    columns: PropTypes.array.isRequired,
    CellComponent: PropTypes.oneOfType([ PropTypes.func, PropTypes.node ]).isRequired,
    getRowData: PropTypes.func.isRequired,
    rowIndex: PropTypes.number.isRequired,
    rowDataIndex: PropTypes.number.isRequired,
    getRowExtraProps: PropTypes.func
};

export default Row;