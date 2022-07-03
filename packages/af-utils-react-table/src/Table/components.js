import { memo } from "react";

/*
    If all cells in a row would be completely empty - row can "collapse" short.
    To prevent it we can fill it with &nbsp;
*/
const CellForEmptyRow = ({ data: D }) => (
    <D.components.Td colSpan={D.columns.length}>&nbsp;</D.components.Td>
);

if (process.env.NODE_ENV !== "production") {
    var warnedAboutAbsentRef = false;
}

const Row = ({ i, i2, model, data }) => {
    const rowData = data.getRowData(i);
    const C = data.components;
    const rowProps = data.getRowProps(model, i2, rowData);

    if (process.env.NODE_ENV !== "production") {
        if (warnedAboutAbsentRef === false && !rowProps.ref) {
            warnedAboutAbsentRef = true;
            throw new Error(
                "ref should be present in getRowProps return value"
            );
        }
    }

    return (
        <C.Tr {...rowProps}>
            {rowData ? (
                data.columns.map(Column => (
                    <C.Td key={Column.key} className={Column._className}>
                        <Column.Cell row={rowData} column={Column} />
                    </C.Td>
                ))
            ) : (
                <C.CellForEmptyRow data={data} />
            )}
        </C.Tr>
    );
};

const HeaderCell = ({ column }) => column.label;

const HeaderCells = ({ columns, components: C }) =>
    columns.map((column, i) => (
        <C.Th
            key={column.key}
            style={column._styleObj}
            className={column._className}
        >
            <C.HeaderCell column={column} i={i} />
        </C.Th>
    ));

const FooterCell = ({ column }) => null;

const FooterCells = ({ columns, components: C }) =>
    columns.map((column, i) => (
        <C.Td
            key={column.key}
            style={column._styleObj}
            className={column._className}
        >
            <C.FooterCell column={column} i={i} />
        </C.Td>
    ));

const Cell = ({ row, column }) => {
    const cellData = row[column.key];

    if (cellData === undefined) {
        return "\u00A0";
    }

    if (column.format) {
        return column.format(cellData);
    }

    if (column.render) {
        return column.render(cellData, row);
    }

    return cellData;
};

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
    Row: memo(Row),
    Cell,
    CellForEmptyRow,
    HeaderCell,
    HeaderCells,
    FooterCell,
    FooterCells,

    /* To prevent double memoization in case of HOC usage */
    OriginalRow: Row
};

export default DEFAULT_COMPONENTS_MAP;
