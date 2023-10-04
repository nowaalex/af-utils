import PubSub from "models/PubSub";
import type Columns from "..";

export interface ColumnDefinition {
    key: string;
    label: string;
    hidden?: boolean;
    align?: "left" | "center" | "right";
    style?: object;
    watch?: () => () => void;
}

class Column extends PubSub {
    columns: Columns;

    key: string;
    hidden = false;
    align: ColumnDefinition["align"] = "left";
    style: ColumnDefinition["style"] = undefined;
    label: ColumnDefinition["label"] = "";
    watch: ColumnDefinition["watch"];

    constructor(col: ColumnDefinition, columns: Columns) {
        super();
        this.columns = columns;
        this.key = col.key;
        this.watch = col.watch;
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
