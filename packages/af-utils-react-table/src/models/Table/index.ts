import Columns from "models/Columns";
import Rows from "models/Rows";
import type { ColumnDefinition } from "models/Columns/Column";
import type { RowDataGetter, RowKeyGetter } from "types";

class Table {
    columns: Columns;
    rows: Rows;

    constructor(
        columns: ColumnDefinition[],
        count: number,
        getRowData: RowDataGetter,
        getRowKey: RowKeyGetter
    ) {
        this.columns = new Columns(this, columns);
        this.rows = new Rows(this, count, getRowData, getRowKey);
    }

    set(
        columns: ColumnDefinition[],
        rowCount: number,
        getRowData: RowDataGetter,
        getRowKey: RowKeyGetter
    ) {
        this.columns.set(columns);
        this.rows.set(rowCount, getRowData, getRowKey);
    }
}

export default Table;
