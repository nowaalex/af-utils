class Row {
    key = undefined;
    value = null;

    constructor(table, idx) {
        this._idx = idx;
        this.table = table;
    }

    onCreated() {
        this.value = this.table.getRowData(this._idx);
        this.key = this.table.getRowKey(this.value);
    }

    destructor() {}
}

export default Row;
