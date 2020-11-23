import ListBase from "../ListBase";

import {
    START_INDEX,
    END_INDEX,
    SCROLL_TOP,
    ROWS_QUANTITY,
    OVERSCAN_ROWS_COUNT,
    WIDGET_WIDTH,
    WIDGET_HEIGHT,
    VIRTUAL_TOP_OFFSET,
    WIDGET_SCROLL_HEIGHT,
    ROWS_CONTAINER_NODE,
    CACHED_ROWS_HEIGHT,
} from "constants/events";

class FixedSizeList extends ListBase {

    rowHeight = 0;

    setRowHeight( v ){
        if( v !== this.rowHeight ){
            this.rowHeight = v;
            this.emit( CACHED_ROWS_HEIGHT );
        }
    }

    constructor(){
        super();

        this.on( this.updateRowHeight, WIDGET_WIDTH, WIDGET_HEIGHT, ROWS_CONTAINER_NODE, ROWS_QUANTITY );
    }

    getIndex( offset ){
        return Math.floor( offset / this.rowHeight );
    }

    getOffset( index ){
        return index * this.rowHeight;
    }

    updateRowHeight(){
        if( this.widgetWidth && this.widgetHeight && this.rowsContainerNode && this.rowsQuantity ){
            const { firstElementChild } = this.rowsContainerNode;
            if( firstElementChild ){
                this.setRowHeight( firstElementChild.offsetHeight );
            }
        }
        else {
            this.setRowHeight( this.estimatedRowHeight )
        }
    }
}

export default FixedSizeList;