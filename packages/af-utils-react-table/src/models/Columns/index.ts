import PubSub from "models/PubSub";
import Column from "./Column";
import type { ColumnDefinition } from "./Column";
import type Table from "models/Table";
import hash from "utils/hash";

class Columns extends PubSub {
    table: Table;
    hash = 0;
    private list: Column[] = [];

    constructor(table: Table) {
        super();
        this.table = table;
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

    atKey(key: string) {
        return this.list.find(col => col.key === key);
    }

    map(fn: (col: Column, index: number, columns: Column[]) => any) {
        return this.list.map(fn);
    }

    [Symbol.iterator]() {
        return this.list[Symbol.iterator]();
    }
}

export default Columns;
