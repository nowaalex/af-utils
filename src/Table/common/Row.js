import React from "react";
import PropTypes from "prop-types";
import getRowProps from "../../utils/getRowProps";

const Row = ({ columns, CellComponent, getRowData, getRowExtraProps, rowDataIndex, rowIndex }) => {

    const rowData = getRowData( rowDataIndex );

    return (
        <tr {...getRowProps(rowData,rowDataIndex,getRowExtraProps)}>
            {columns.map(( column, columnIndex ) => column.visibility !== "hidden" ? (
                <CellComponent
                    key={column.dataKey}
                    rowData={rowData}
                    rowIndex={rowIndex}
                    column={column}
                    columnIndex={columnIndex}
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