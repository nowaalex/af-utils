import PubSub from "models/PubSub";
import Row from "./Row";
import RowsGroup from "./RowsGroup";
import stepHash from "utils/hash";
import type Table from "models/Table";
import type {
    RowKey,
    RowDataGetter,
    RowKeyGetter,
    SortState,
    ColumnKey
} from "types";

class Rows extends PubSub {
    hash = 0;
    table: Table;
    byKey = new Map<RowKey, Row>();
    getRowData: RowDataGetter;
    getRowKey: RowKeyGetter;
    count: number;
    sortState: SortState | null = null;
    groupState: ColumnKey[] = [];
    filterState = [];
    root = new RowsGroup(null, null);

    constructor(
        table: Table,
        count: number,
        getRowData: RowDataGetter,
        getRowKey: RowKeyGetter
    ) {
        super();
        this.table = table;
        this.getRowData = getRowData;
        this.getRowKey = getRowKey;
        this.count = count;
        this.initialize();
    }

    initialize() {
        for (let i = 0; i < this.count; i++) {
            const rowData = this.getRowData(i);

            if (rowData) {
                const key = this.getRowKey(rowData);
                const row = new Row(this, rowData, key, i);
                this.byKey.set(key, row);
            }
        }
        this.group([]);
    }

    sort(sortState: SortState | null) {
        this.sortState = sortState;
    }

    group(groupState: ColumnKey[]) {
        this.groupState = groupState;
        this.root.clear();
        for (const row of this.byKey.values()) {
            row.prescribeGroup();
        }
        this.hash = stepHash();
        this.run();
    }

    sync() {
        this.byKey.clear();
        this.initialize();
        this.hash = stepHash();
        this.run();
    }

    set(count: number, getRowData: RowDataGetter, getRowKey: RowKeyGetter) {
        const changed =
            this.count !== count ||
            this.getRowData !== getRowData ||
            this.getRowKey !== getRowKey;

        this.getRowData = getRowData;
        this.getRowKey = getRowKey;
        this.count = count;

        if (changed) {
            this.sync();
        }
    }

    map(callBack: (row: Row) => any) {
        return Array.from(this.byKey.values(), callBack);
    }
}

export default Rows;
