import PubSub from "models/PubSub";
import Column from "./Column";
import hash from "utils/hash";
import type { ColumnDefinition } from "./Column";
import type Table from "models/Table";
import type { ColumnKey } from "types";

class Columns extends PubSub {
    table: Table;
    hash = 0;
    private list: Column[];

    constructor(table: Table, initialColumns: ColumnDefinition[]) {
        super();
        this.table = table;
        this.list = initialColumns.map(col => new Column(col, this));
    }

    upsert(columns: ColumnDefinition[]) {
        for (const col of columns) {
            const curCol = this.atKey(col.key);
            if (curCol) {
                curCol.merge(col);
            } else {
                this.list.push(new Column(col, this));
                this.hash = hash();
            }
        }
    }

    removeMissing(columns: ColumnDefinition[]) {
        for (let i = 0, len = this.list.length, col: Column; i < len; ) {
            col = this.list[i];
            if (columns.some(newCol => newCol.key === col.key)) {
                i++;
            } else {
                this.list.splice(i, 1);
                this.hash = hash();
                len--;
            }
        }
    }

    set(columns: ColumnDefinition[]) {
        this.removeMissing(columns);
        this.upsert(columns);
        this.run();
    }

    atIndex(index: number) {
        return this.list[index];
    }

    atKey(key: ColumnKey) {
        return this.list.find(col => col.key === key);
    }

    map(fn: (col: Column, index: number, columns: Column[]) => any) {
        return this.list.map(fn);
    }

    get length() {
        return this.list.length;
    }

    [Symbol.iterator]() {
        return this.list[Symbol.iterator]();
    }
}

export default Columns;
