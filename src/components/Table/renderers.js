/*
    If all cells in a row would be completely empty - row can "collapse" short.
    To prevent it we can fill it with &nbsp;
*/
const DEFAULT_EMPTY_CELL_CONTENT = "\u00A0";

export const renderRow = ( rowIndex, columns, getRowData, getCellData, renderCell, CellsList, Cell ) => (
    <tr key={rowIndex}>
        <CellsList
            rowIndex={rowIndex}
            columns={columns}
            getRowData={getRowData}
            getCellData={getCellData}
            renderCell={renderCell}
            Cell={Cell}
        />
    </tr>
);

export const renderCell = ( rowData, rowIndex, column, getCellData, Cell ) => (
    <td key={column.dataKey}>
        <Cell
            rowData={rowData}
            rowIndex={rowIndex}
            column={column}
            getCellData={getCellData}
        />
    </td>
);

export const getCellData = ( rowData, rowIndex, dataKey ) => rowData[ dataKey ];

export const HeaderCell = ({ column }) => (
    <th title={column.title}>
        {column.label}
    </th>
);

export const CellsList = ({ rowIndex, columns, getRowData, getCellData, renderCell, Cell }) => {
    const rowData = getRowData( rowIndex )
    return columns.map( column => renderCell( rowData, rowIndex, column, getCellData, Cell ));
}

export const Cell = ({ rowData, rowIndex, column, getCellData }) => {
    const { render, getEmptyCellData, dataKey, format, getCellData: getCellData2 } = column;

    let cellData = rowData && ( getCellData || getCellData2)( rowData, rowIndex, dataKey );
    
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