import { css } from "@af/styled";

const ALIGN_CLASSES_MAP = {
    right: css( "text-align: right !important;" ),
    left: css( "text-align: left !important;" ),
    center: css( "text-align: center !important;" )
}

class TableColumn {
    constructor( col ){
        this.key = col.key;
        this.align = col.align || "left";
        this.label = col.label || this.key;
        this.format = col.format || null;
        this.render = col.render || null;
        this.formatTotal = col.formatTotal || null;
        this.totals = col.totals || null;
        this.background = col.background || "";
        this.border = col.border || "";
        this.width = col.width ?? "";
        this.minWidth = col.minWidth ?? null;
        this.Cell = col.Cell || null;

        this._styleObj = this.minWidth && { minWidth: this.minWidth };
        this._className = ALIGN_CLASSES_MAP[ this.align ];
    }
}

export default TableColumn;