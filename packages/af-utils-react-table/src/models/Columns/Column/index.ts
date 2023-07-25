import PubSub from "models/PubSub";
import type Columns from "..";

export interface ColumnDefinition {
    key: string;
    label: string;
    hidden?: boolean;
    align?: "left" | "center" | "right";
    style?: object;
}

class Column extends PubSub {
    columns: Columns;

    key: string;
    hidden = false;
    align = "left";
    style = undefined;
    label = "";

    constructor(col: ColumnDefinition, columns: Columns) {
        super();
        this.columns = columns;
        this.key = col.key;
        Object.assign(this, col);
    }

    merge(col: ColumnDefinition) {
        Object.assign(this, col);
        this.run();
    }

    toggle(flag: boolean) {
        this.hidden = flag ?? !this.hidden;
        this.run();
    }
}

export default Column;
