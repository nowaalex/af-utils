import PubSub from "models/PubSub";
import type Column from "models/Columns/Column";
import type { ColumnDefinition } from "models/Columns/Column";
import type Row from "..";

const FLAG_RENDERED = 1;
class Cell extends PubSub {
    column: WeakRef<Column>;
    row: Row;
    value: any;
    mask = 0;
    unwatch: undefined | ReturnType<Required<ColumnDefinition>["watch"]> =
        undefined;

    constructor(column: Column, row: Row) {
        super();
        this.column = new WeakRef(column);
        this.row = row;
        this.value = row.value[column.key];
    }

    updateValue() {
        const column = this.column.deref();
        if (column) {
            const value = this.row.value[column.key];

            if (value !== this.value) {
                this.value = value;
                this.run();
            }
        }
    }

    setRendered(flag: boolean) {
        this.unwatch?.();
        if (flag) {
            const column = this.column.deref();

            if (column) {
                this.unwatch = column.watch?.(this);
            }
        }
    }
}

export default Cell;
