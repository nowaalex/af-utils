import React from "react";
import PropTypes from "prop-types";
import { getRowProps } from "../../utils/extraPropsGetters";

const Row = ({ columns, CellComponent, getRowData, getCellData, getRowExtraProps, getCellExtraProps, rowDataIndex, rowIndex }) => {

    const rowData = getRowData( rowDataIndex );

    return (
        <tr {...getRowProps(rowData,rowIndex,rowDataIndex,getRowExtraProps)}>
            {columns.map(( column, columnIndex ) => {
                if( column.visibility === "hidden" ){
                    return null;
                }

                const FinalCellComponent = column.CellComponent || CellComponent;

                return (
                    <FinalCellComponent
                        key={column.dataKey}
                        rowData={rowData}
                        rowIndex={rowIndex}
                        column={column}
                        columnIndex={columnIndex}
                        getCellData={getCellData}
                        getCellExtraProps={column.getCellExtraProps||getCellExtraProps}
                    />
                );
            })}
        </tr>
    );
};

Row.propTypes = {
    getCellData: PropTypes.func.isRequired,
    columns: PropTypes.array.isRequired,
    CellComponent: PropTypes.elementType.isRequired,
    getRowData: PropTypes.func.isRequired,
    rowIndex: PropTypes.number.isRequired,
    rowDataIndex: PropTypes.number.isRequired,
    getRowExtraProps: PropTypes.func,
    getCellExtraProps: PropTypes.func
};

export default Row;