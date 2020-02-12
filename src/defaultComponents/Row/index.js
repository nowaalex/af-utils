import React from "react";

const Row = ({ columns, CellComponent, getRowData, getRowExtraProps, rowIndex, EmptyDataRowComponent }) => {

    const rowData = getRowData( rowIndex );
    const extraProps = getRowExtraProps ? getRowExtraProps( rowData, rowIndex ) : undefined;

    return rowData ? (
        <tr {...extraProps}>
            {columns.map(( column, columnIndex ) => (
                <CellComponent
                    key={column.dataKey}
                    rowData={rowData}
                    columnIndex={columnIndex}
                    column={column}
                />
            ))}
        </tr>
    ) : (
        <EmptyDataRowComponent rowIndex={rowIndex} columns={columns} />
    );
};

export default Row;