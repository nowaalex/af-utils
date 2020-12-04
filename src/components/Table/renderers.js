/*
    If all cells in a row would be completely empty - row can "collapse" short.
    To prevent it we can fill it with &nbsp;
*/
const DEFAULT_EMPTY_CELL_CONTENT = "\u00A0";

export const Row = ({ index, columns, getRowData, getRowProps, renderCell, Cell }) => {

    const rowData = getRowData( index );

    return (
        <tr {...(getRowProps&&getRowProps(rowData,index))}>
            {columns.map( column => renderCell( rowData, index, column, Cell ))}
        </tr>
    );
}

export const renderRow = RowProps => <RowProps.Row key={RowProps.index} {...RowProps} />

export const renderCell = ( rowData, rowIndex, column, Cell ) => rowData ? (
    <td key={column.dataKey}>
        <Cell
            rowData={rowData}
            rowIndex={rowIndex}
            column={column}
        />
    </td>
) : null;

export const renderHeaderCells = columns => columns.map( column => (
    <th key={column.dataKey}>
        {column.label}
    </th>
));

export const renderFooter = normalizedVisibleColumns => null;

export const Cell = ({ rowData, rowIndex, column }) => {
    const { render, getEmptyCellData, dataKey, format } = column;

    let cellData = rowData[ dataKey ];
    
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