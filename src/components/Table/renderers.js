/*
    If all cells in a row would be completely empty - row can "collapse" short.
    To prevent it we can fill it with &nbsp;
*/
const DEFAULT_EMPTY_CELL_CONTENT = "\u00A0";

export const Row = ({ index, columns, getRowData, getRowProps, Cell }) => {

    const rowData = getRowData( index );

    return (
        <tr {...(getRowProps&&getRowProps(rowData,index))}>
            {rowData ? columns.map( column => {
                const FinalCell = column.Cell || Cell;
                return (
                    <td key={column.dataKey}>
                        <FinalCell rowData={rowData} column={column} />
                    </td>
                );
            }) : (
                <td colSpan={columns.length}>
                    {DEFAULT_EMPTY_CELL_CONTENT}
                </td>
            )}
        </tr>
    );
}

export const renderRow = ( index, RowProps ) => <RowProps.Row key={index} index={index} {...RowProps} />

export const renderHeaderCells = columns => columns.map( column => (
    <th key={column.dataKey} style={{ minWidth: column.minWidth }}>
        {column.label}
    </th>
));

export const Cell = ({ rowData, column }) => {
    const { render, dataKey, format } = column;

    let cellData = rowData[ dataKey ];
    
    if( cellData === undefined ){
        return DEFAULT_EMPTY_CELL_CONTENT;
    }

    if( render ){
        return render( cellData, rowData );
    }

    if( format ){
        return format( cellData );
    }

    return cellData;
}