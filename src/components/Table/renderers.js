/*
    If all cells in a row would be completely empty - row can "collapse" short.
    To prevent it we can fill it with &nbsp;
*/
const DEFAULT_EMPTY_CELL_CONTENT = "\u00A0";

export const renderRow = ( rowIndex, columns, getRowData, renderCell, CellsList, Cell ) => (
    <tr key={rowIndex}>
        <CellsList
            rowIndex={rowIndex}
            columns={columns}
            getRowData={getRowData}
            renderCell={renderCell}
            Cell={Cell}
        />
    </tr>
);

export const renderCell = ( rowData, rowIndex, column, Cell ) => (
    <td key={column.dataKey}>
        <Cell
            rowData={rowData}
            rowIndex={rowIndex}
            column={column}
        />
    </td>
);

export const renderHeaderCells = columns => columns.map( column => (
    <th key={column.dataKey}>
        {column.label}
    </th>
));

export const renderFooter = normalizedVisibleColumns => null;

export const CellsList = ({ rowIndex, columns, getRowData, renderCell, Cell }) => {
    const rowData = getRowData( rowIndex );
    return columns.map( column => renderCell( rowData, rowIndex, column, Cell ));
}

export const Cell = ({ rowData, rowIndex, column }) => {
    const { render, getEmptyCellData, dataKey, format } = column;

    let cellData = rowData && rowData[ dataKey ];
    
    if( cellData === undefined || cellData === "" ){
        cellData = getEmptyCellData ? getEmptyCellData( rowIndex, column ) : DEFAULT_EMPTY_CELL_CONTENT;
    }
    else{
        if( format ){
            cellData = format( cellData, rowData );
        }
        if( render ){
            cellData = render( cellData, rowData, rowIndex, column );
        }
    }

    return cellData;
}