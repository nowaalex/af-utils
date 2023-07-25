import Columns from "models/Columns";
import Rows from "models/Rows";
import type { ColumnDefinition } from "models/Columns/Column";
import type { RowDataGetter, RowKeyGetter } from "types";

class Table {
    columns = new Columns(this);
    rows = new Rows(this);

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
