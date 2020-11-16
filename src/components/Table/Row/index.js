import PropTypes from "prop-types";

const Row = ({ columns, CellComponent, getRowData, getRowExtraProps, getCellExtraProps, rowDataIndex, rowIndex }) => {

    const rowData = getRowData( rowDataIndex );

    return (
        <tr {...( getRowExtraProps && getRowExtraProps(rowData,rowIndex,rowDataIndex))} aria-rowindex={rowIndex + 1}>
            {columns.map(( column, columnIndex ) => {
                const FinalCellComponent = column.CellComponent || CellComponent;

                return (
                    <FinalCellComponent
                        key={column.dataKey}
                        rowData={rowData}
                        rowIndex={rowIndex}
                        column={column}
                        columnIndex={columnIndex}
                        getCellExtraProps={column.getCellExtraProps||getCellExtraProps}
                    />
                );
            })}
        </tr>
    );
};

Row.propTypes = {
    columns: PropTypes.array.isRequired,
    CellComponent: PropTypes.elementType.isRequired,
    getRowData: PropTypes.func.isRequired,
    rowIndex: PropTypes.number.isRequired,
    rowDataIndex: PropTypes.number.isRequired,
    getRowExtraProps: PropTypes.func,
    getCellExtraProps: PropTypes.func
};

export default Row;