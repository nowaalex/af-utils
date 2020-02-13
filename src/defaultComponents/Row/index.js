import React from "react";
import PropTypes from "prop-types";

const Row = ({ columns, CellComponent, getRowData, getRowExtraProps, rowIndex }) => {

    const rowData = getRowData( rowIndex );
    const extraProps = getRowExtraProps && getRowExtraProps( rowData, rowIndex );

    return (
        <tr {...extraProps}>
            {columns.map(( column, columnIndex ) => column.visibility !== "hidden" ? (
                <CellComponent
                    key={column.dataKey}
                    rowData={rowData}
                    columnIndex={columnIndex}
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
    getRowExtraProps: PropTypes.func
};

export default Row;