import { css } from "@af-utils/styled";
import pick from "utils/pick";

const ALIGN_CLASSES_MAP = {
    right: css("text-align: right !important;"),
    left: css("text-align: left !important;"),
    center: css("text-align: center !important;")
};

const renderDefault = cellData => cellData;
class TableColumn {
    static KEYS = [
        "key",
        "align",
        "label",
        "render",
        "format",
        "Cell",
        "background",
        "border",
        "width",
        "minWidth"
    ];

    constructor(col, components) {
        Object.assign(this, pick(col, this.constructor.KEYS));

        this.align ||= "left";
        this.label ||= this.key;
        this.Cell ||= components.Cell;
        this.render ||= renderDefault;

        this._styleObj = this.minWidth && { minWidth: this.minWidth };
        this._className = ALIGN_CLASSES_MAP[this.align];
    }
}

export default TableColumn;
