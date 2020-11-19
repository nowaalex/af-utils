import BaseClass from "../BaseClass";

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

class FixedHeight extends BaseClass {

    rowHeight = 0;

    setRowHeight( v ){
        if( v !== this.rowHeight ){
            this.rowHeight = v;
            this.e( CACHED_ROWS_HEIGHT );
        }
    }

    constructor(){
        super();

        this
            .on( this.updateRowHeight, WIDGET_WIDTH, WIDGET_HEIGHT, ROWS_CONTAINER_NODE, ROWS_QUANTITY )
            .on( this.updateWidgetScrollHeight, CACHED_ROWS_HEIGHT, ROWS_QUANTITY );
    }

    pxToIndex( px ){
        return Math.floor( px / this.rowHeight );
    }

    indexToPx( index ){
        return index * this.rowHeight;
    }

    updateWidgetScrollHeight(){
        const v = this.rowHeight * this.rowsQuantity;
        if( v !== this.widgetScrollHeight ){
            this.widgetScrollHeight = v;
            this.e( WIDGET_SCROLL_HEIGHT );
        }
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

export default FixedHeight;