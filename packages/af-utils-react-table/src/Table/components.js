import { memo } from "react";
import { areIndexesEqual } from "@af-utils/react-virtual-headless";

/*
    If all cells in a row would be completely empty - row can "collapse" short.
    To prevent it we can fill it with &nbsp;
*/
const CellForEmptyRow = ({ data: D }) => (
    <D.components.Td colSpan={D.columns.length}>
        &nbsp;
    </D.components.Td>
);

const Row = ({ i, data }) => {

    const rowData = data.getRowData( i );
    const C = data.components;

    return (
        <C.Tr {...(data.getRowProps&&data.getRowProps(rowData,i))}>
            {rowData ? data.columns.map( column => {
                const FinalCell = column.Cell || C.Cell;
                return (
                    <C.Td key={column.key} className={column._className}>
                        <FinalCell row={rowData} column={column} />
                    </C.Td>
                );
            }) : (
                <C.CellForEmptyRow data={data} />
            )}
        </C.Tr>
    );
}

const HeaderCell = ({ column }) => column.label;

const HeaderCells = ({ columns, components: C }) => columns.map(( column, i ) => (
    <C.Th
        key={column.key}
        style={column._styleObj}
        className={column._className}
    >
        <C.HeaderCell column={column} i={i} />
    </C.Th>
));

const FooterCell = ({ column }) => null;

const FooterCells = ({ columns, components: C }) => columns.map(( column, i ) => (
    <C.Td
        key={column.key}
        style={column._styleObj}
        className={column._className}
    >
        <C.FooterCell column={column} i={i} />
    </C.Td>
));

const Cell = ({ row, column }) => {
    const { render, key, format } = column;

    const cellData = row[ key ];
    
    if( cellData === undefined ){
        return "\u00A0";
    }

    if( render ){
        return render( cellData, row );
    }

    if( format ){
        return format( cellData );
    }

    return cellData;
}

const DEFAULT_COMPONENTS_MAP = {

    /* Basic Elements */
    Table: "table",
    Tbody: "tbody",
    Thead: "thead",
    Tfoot: "tfoot",
    Tr: "tr",
    Td: "td",
    Th: "th",

    /* Extra */
    Row: memo( Row, areIndexesEqual ),
    Cell,
    CellForEmptyRow,
    HeaderCell,
    HeaderCells,
    FooterCell,
    FooterCells,

    /* To prevent double memoization in case of HOC usage */
    OriginalRow: Row
}

export default DEFAULT_COMPONENTS_MAP;