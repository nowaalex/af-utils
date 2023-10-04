import PubSub from "models/PubSub";
import type Row from "models/Rows/Row";

class RowsGroup extends PubSub {
    map = new Map();
    children: (Row | RowsGroup)[] = [];
    parent: RowsGroup | null;
    value: any;

    constructor(parent: RowsGroup | null, value: any) {
        super();
        this.parent = parent;
        this.value = value;
    }

    add(row: Row | RowsGroup) {
        this.children.push(row);
    }

    sort() {
        this.children.sort();
    }

    clear() {
        this.map.clear();
        this.children = [];
    }
}

export default RowsGroup;
