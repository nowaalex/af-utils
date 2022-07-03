import Row from "../Row";

class Table {
    _rows = [];
    _rowsByKey = new Map();
    _getRowByIndex = null;
    _getRowKey = null;

    constructor() {}

    setDataGetters(getRowData, getRowKey) {
        if (this._getRowData !== getRowData) {
            this._getRowData = getRowData;
        }
        if (this._getRowKey !== getRowKey) {
            this._getRowKey = getRowKey;
        }
    }

    setItemCount(itemCount) {
        const curItemCount = this._rows.length;

        if (itemCount > curItemCount) {
            for (let i = curItemCount; i < itemCount; i++) {
                const newRow = new Row(this, i);
                if (newRow.key) {
                    this._rows.push(newRow);
                }
            }
        } else if (itemCount < curItemCount) {
            if (itemCount > 0) {
            } else {
                this.clearRows();
            }
        }
    }

    clearRows() {
        for (const row of this._rows) {
            row.destructor();
        }
        this._rows = [];
    }
}

export default Table;
