import PubSub from "models/PubSub";
import Row from "./Row";
import type Table from "models/Table";
import type { RowDataGetter, RowKeyGetter } from "types";

const getRowDataDefault = (index: number) => ({});
const getRowKeyDefault = (rowData: object) => "" as string | number;

class Rows extends PubSub {
    table: Table;
    list: Row[] = [];
    getRowData = getRowDataDefault;
    getRowKey = getRowKeyDefault;

    constructor(table: Table) {
        super();
        this.table = table;
    }

    set(count: number, getRowData: RowDataGetter, getRowKey: RowKeyGetter) {
        this.getRowData = getRowData;
        this.getRowKey = getRowKey;

        this.list = [];

        for (let i = 0; i < count; i++) {
            const rowData = getRowData(i);
            if (rowData) {
                this.list.push(new Row(this, rowData, i));
            }
        }

        this.run();
    }
}

export default Rows;
