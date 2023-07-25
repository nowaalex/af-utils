import type { RowData } from "types";
import type Rows from "..";
import Cell from "./Cell";
import Column from "models/Columns/Column";

class Row {
    rows: Rows;
    index: number;
    value: RowData;

    cells = new WeakMap<Column, Cell>();
    private rendered = false;

    constructor(rows: Rows, value: object, index: number) {
        this.rows = rows;
        this.value = value;
        this.index = index;

        for (const column of rows.table.columns) {
            this.cells.set(column, new Cell(column, this));
        }
    }

    updateCells() {
        for (const column of this.rows.table.columns) {
            const cell = this.cells.get(column);

            if (cell) {
                cell.updateValue();
            } else {
                this.cells.set(column, new Cell(column, this));
            }
        }
    }

    update() {
        const value = this.rows.getRowData(this.index);

        if (value !== this.value) {
            this.updateCells();
        }
    }

    setRendered(flag: boolean) {
        this.rendered = flag;
    }
}

export default Row;
