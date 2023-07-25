import PubSub from "models/PubSub";
import type Column from "models/Columns/Column";
import type Row from "..";

class Cell extends PubSub {
    column: WeakRef<Column>;
    row: Row;
    value: any;

    constructor(column: Column, row: Row) {
        super();
        this.column = new WeakRef(column);
        this.row = row;
        this.value = (row.value as any)[column.key];
    }

    updateValue() {
        const column = this.column.deref();
        if (column) {
            const value = (this.row.value as any)[column.key];

            if (value !== this.value) {
                this.value = value;
                this.run();
            }
        }
    }
}

export default Cell;
