import type { RowData, RowKey } from "types";
import type Rows from "..";
import Cell from "./Cell";
import type Column from "models/Columns/Column";
import RowsGroup from "../RowsGroup";

class Row {
    key: RowKey;
    rows: Rows;
    index: number;
    value: RowData;
    private currentGroup: RowsGroup | null = null;

    cells = new WeakMap<Column, Cell>();
    private rendered = false;

    constructor(rows: Rows, value: object, key: RowKey, index: number) {
        this.rows = rows;
        this.value = value;
        this.index = index;
        this.key = key;

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

    prescribeGroup() {
        let tmpObj = this.rows.root;

        for (const group of this.rows.groupState) {
            const column = this.rows.table.columns.atKey(group);
            if (column) {
                const cell = this.cells.get(column);
                if (cell) {
                    const tmpInner = tmpObj.map.get(cell.value);

                    if (tmpInner) {
                        tmpObj = tmpInner;
                    } else {
                        const newGroup = new RowsGroup(tmpObj, cell.value);
                        tmpObj.map.set(cell.value, newGroup);
                        tmpObj.add(newGroup);
                        tmpObj = newGroup;
                    }
                }
            }
        }

        if (tmpObj !== this.currentGroup) {
            tmpObj.add(this);
            this.currentGroup = tmpObj;
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

    destroy() {}
}

export default Row;
